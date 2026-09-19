import { describe, expect, it } from "vitest";
import { db } from "@/db/client";
import { categories, transactions } from "@/db/schema";
import {
  getCategoryBreakdown,
  getMonthlyTrend,
  getRecentTransactions,
  getTotals,
} from "@/lib/calculations";

async function makeCategory(name: string, color = "#000000") {
  const [c] = await db.insert(categories).values({ name, color }).returning();
  return c;
}

describe("getTotals", () => {
  it("returns zero for an empty dataset", async () => {
    expect(await getTotals()).toEqual({ income: 0, expenses: 0, balance: 0 });
  });

  it("computes income, expenses, and balance", async () => {
    const salary = await makeCategory("Salary");
    const food = await makeCategory("Food");

    await db.insert(transactions).values([
      { amountCents: 500000, type: "income", categoryId: salary.id, occurredAt: new Date() },
      { amountCents: 12000, type: "expense", categoryId: food.id, occurredAt: new Date() },
      { amountCents: 3000, type: "expense", categoryId: food.id, occurredAt: new Date() },
    ]);

    const totals = await getTotals();
    expect(totals.income).toBe(500000);
    expect(totals.expenses).toBe(15000);
    expect(totals.balance).toBe(485000);
  });

  it("allows a negative balance when expenses exceed income", async () => {
    const food = await makeCategory("Food");
    await db
      .insert(transactions)
      .values({ amountCents: 10000, type: "expense", categoryId: food.id, occurredAt: new Date() });

    const totals = await getTotals();
    expect(totals.balance).toBe(-10000);
  });
});

describe("getCategoryBreakdown", () => {
  it("groups expense totals per category, excluding income", async () => {
    const food = await makeCategory("Food");
    const rent = await makeCategory("Rent");
    const salary = await makeCategory("Salary");

    await db.insert(transactions).values([
      { amountCents: 5000, type: "expense", categoryId: food.id, occurredAt: new Date() },
      { amountCents: 3000, type: "expense", categoryId: food.id, occurredAt: new Date() },
      { amountCents: 120000, type: "expense", categoryId: rent.id, occurredAt: new Date() },
      { amountCents: 500000, type: "income", categoryId: salary.id, occurredAt: new Date() },
    ]);

    const breakdown = await getCategoryBreakdown();
    const byName = Object.fromEntries(breakdown.map((c) => [c.name, c.totalCents]));

    expect(byName["Food"]).toBe(8000);
    expect(byName["Rent"]).toBe(120000);
    // Income transactions must not count toward category spending totals.
    expect(byName["Salary"]).toBe(0);
  });

  it("includes categories with zero spending", async () => {
    await makeCategory("Unused");
    const breakdown = await getCategoryBreakdown();
    expect(breakdown.find((c) => c.name === "Unused")?.totalCents).toBe(0);
  });
});

describe("getMonthlyTrend", () => {
  it("always returns exactly `months` entries, filling gaps with zero", async () => {
    const trend = await getMonthlyTrend(6);
    expect(trend).toHaveLength(6);
    expect(trend.every((m) => m.totalCents === 0)).toBe(true);
  });

  it("attributes spending to the correct calendar month", async () => {
    const food = await makeCategory("Food");
    const now = new Date();
    const thisMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    await db
      .insert(transactions)
      .values({ amountCents: 4500, type: "expense", categoryId: food.id, occurredAt: now });

    const trend = await getMonthlyTrend(6);
    const thisMonth = trend.find((m) => m.month === thisMonthKey);
    expect(thisMonth?.totalCents).toBe(4500);
  });
});

describe("getRecentTransactions", () => {
  it("orders by most recent first and respects the limit", async () => {
    const food = await makeCategory("Food");
    await db.insert(transactions).values([
      { amountCents: 1000, type: "expense", categoryId: food.id, occurredAt: new Date("2026-01-01") },
      { amountCents: 2000, type: "expense", categoryId: food.id, occurredAt: new Date("2026-03-01") },
      { amountCents: 3000, type: "expense", categoryId: food.id, occurredAt: new Date("2026-02-01") },
    ]);

    const recent = await getRecentTransactions(2);
    expect(recent).toHaveLength(2);
    expect(recent[0].amountCents).toBe(2000); // March, most recent
    expect(recent[1].amountCents).toBe(3000); // February
  });
});
