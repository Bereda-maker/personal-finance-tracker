import { and, desc, eq, gte, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { categories, transactions } from "@/db/schema";

/**
 * All aggregate math (sums, group-bys, date-range totals) is done in SQL,
 * not by fetching every transaction and reducing over it in JavaScript.
 * That keeps the dashboard fast and correct regardless of how many
 * transactions accumulate over time.
 */

export async function getTotals() {
  const [row] = await db
    .select({
      income: sql<number>`coalesce(sum(case when ${transactions.type} = 'income' then ${transactions.amountCents} else 0 end), 0)`,
      expenses: sql<number>`coalesce(sum(case when ${transactions.type} = 'expense' then ${transactions.amountCents} else 0 end), 0)`,
    })
    .from(transactions);

  const income = Number(row?.income ?? 0);
  const expenses = Number(row?.expenses ?? 0);

  return {
    income,
    expenses,
    balance: income - expenses,
  };
}

export async function getCategoryBreakdown() {
  const rows = await db
    .select({
      categoryId: categories.id,
      name: categories.name,
      color: categories.color,
      totalCents: sql<number>`coalesce(sum(${transactions.amountCents}), 0)`,
    })
    .from(categories)
    .leftJoin(
      transactions,
      and(eq(transactions.categoryId, categories.id), eq(transactions.type, "expense")),
    )
    .groupBy(categories.id)
    .orderBy(desc(sql`sum(${transactions.amountCents})`));

  return rows.map((r) => ({ ...r, totalCents: Number(r.totalCents) }));
}

/** Total expenses per calendar month for the last `months` months, oldest first. */
export async function getMonthlyTrend(months = 6) {
  const rows = await db
    .select({
      month: sql<string>`strftime('%Y-%m', ${transactions.occurredAt}, 'unixepoch')`,
      totalCents: sql<number>`coalesce(sum(${transactions.amountCents}), 0)`,
    })
    .from(transactions)
    .where(
      and(
        eq(transactions.type, "expense"),
        gte(
          transactions.occurredAt,
          sql`(strftime('%s', 'now', 'start of month', ${sql.raw(`'-${months - 1} months'`)}))`,
        ),
      ),
    )
    .groupBy(sql`strftime('%Y-%m', ${transactions.occurredAt}, 'unixepoch')`)
    .orderBy(sql`strftime('%Y-%m', ${transactions.occurredAt}, 'unixepoch')`);

  // Fill in months with zero spending so the chart always shows `months` bars.
  const now = new Date();
  const result: { month: string; totalCents: number }[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const match = rows.find((r) => r.month === key);
    result.push({ month: key, totalCents: Number(match?.totalCents ?? 0) });
  }
  return result;
}

export async function getRecentTransactions(limit = 10) {
  return db
    .select({
      id: transactions.id,
      amountCents: transactions.amountCents,
      type: transactions.type,
      occurredAt: transactions.occurredAt,
      note: transactions.note,
      categoryId: transactions.categoryId,
      categoryName: categories.name,
      categoryColor: categories.color,
    })
    .from(transactions)
    .innerJoin(categories, eq(transactions.categoryId, categories.id))
    .orderBy(desc(transactions.occurredAt), desc(transactions.id))
    .limit(limit);
}
