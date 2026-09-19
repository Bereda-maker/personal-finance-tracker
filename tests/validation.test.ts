import { describe, expect, it } from "vitest";
import { categoryInputSchema, transactionInputSchema } from "@/lib/validation";

describe("transactionInputSchema", () => {
  const valid = {
    amount: 12.5,
    type: "expense" as const,
    categoryId: 1,
    occurredAt: "2026-09-01",
    note: "Lunch",
  };

  it("accepts a fully valid transaction", () => {
    expect(transactionInputSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects a negative amount", () => {
    const result = transactionInputSchema.safeParse({ ...valid, amount: -5 });
    expect(result.success).toBe(false);
  });

  it("rejects a zero amount", () => {
    const result = transactionInputSchema.safeParse({ ...valid, amount: 0 });
    expect(result.success).toBe(false);
  });

  it("rejects more than 2 decimal places", () => {
    const result = transactionInputSchema.safeParse({ ...valid, amount: 12.505 });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid transaction type", () => {
    const result = transactionInputSchema.safeParse({ ...valid, type: "transfer" });
    expect(result.success).toBe(false);
  });

  it("rejects a missing category", () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { categoryId, ...withoutCategory } = valid;
    const result = transactionInputSchema.safeParse(withoutCategory);
    expect(result.success).toBe(false);
  });

  it("rejects a non-positive category id", () => {
    const result = transactionInputSchema.safeParse({ ...valid, categoryId: 0 });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid date", () => {
    const result = transactionInputSchema.safeParse({ ...valid, occurredAt: "not-a-date" });
    expect(result.success).toBe(false);
  });

  it("rejects an excessively long note", () => {
    const result = transactionInputSchema.safeParse({ ...valid, note: "x".repeat(281) });
    expect(result.success).toBe(false);
  });

  it("allows an empty note", () => {
    const result = transactionInputSchema.safeParse({ ...valid, note: "" });
    expect(result.success).toBe(true);
  });

  it("allows an omitted note", () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { note, ...withoutNote } = valid;
    const result = transactionInputSchema.safeParse(withoutNote);
    expect(result.success).toBe(true);
  });
});

describe("categoryInputSchema", () => {
  it("accepts a valid category", () => {
    expect(categoryInputSchema.safeParse({ name: "Food", color: "#f97316" }).success).toBe(true);
  });

  it("rejects an empty name", () => {
    expect(categoryInputSchema.safeParse({ name: "", color: "#f97316" }).success).toBe(false);
  });

  it("rejects a name over 50 characters", () => {
    expect(
      categoryInputSchema.safeParse({ name: "x".repeat(51), color: "#f97316" }).success,
    ).toBe(false);
  });

  it("rejects a non-hex color", () => {
    expect(categoryInputSchema.safeParse({ name: "Food", color: "orange" }).success).toBe(false);
  });

  it("rejects a 3-digit hex shorthand (only 6-digit accepted)", () => {
    expect(categoryInputSchema.safeParse({ name: "Food", color: "#fff" }).success).toBe(false);
  });
});
