import { asc } from "drizzle-orm";
import { db } from "@/db/client";
import { categories } from "@/db/schema";
import {
  getCategoryBreakdown,
  getMonthlyTrend,
  getRecentTransactions,
  getTotals,
} from "@/lib/calculations";
import { SummaryCards } from "@/components/dashboard/SummaryCards";
import { CategoryBreakdown } from "@/components/dashboard/CategoryBreakdown";
import { SixMonthTrend } from "@/components/dashboard/SixMonthTrend";
import { QuickAdd } from "@/components/transactions/QuickAdd";
import { TransactionList } from "@/components/transactions/TransactionList";

// This dashboard reads live financial data straight from the database on
// every request. Without this, Next.js would statically prerender it at
// build time, and router.refresh() after adding/editing/deleting a
// transaction would keep showing stale, build-time data in production.
export const dynamic = "force-dynamic";

// This is a Server Component: it reads straight from the database with no
// API round trip, since the data it needs (dashboard aggregates) is only
// ever consumed here. Client Components below (QuickAdd, TransactionList)
// call the /api routes only for the mutations they perform, then use
// router.refresh() to re-run this Server Component with fresh data.
export default async function Home() {
  const [totals, categoryBreakdown, monthlyTrend, recentTransactions, allCategories] =
    await Promise.all([
      getTotals(),
      getCategoryBreakdown(),
      getMonthlyTrend(6),
      getRecentTransactions(15),
      db.select().from(categories).orderBy(asc(categories.name)),
    ]);

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-4 sm:p-8">
      <header>
        <h1 className="text-xl font-semibold text-gray-900">Personal Finance Tracker</h1>
      </header>

      <SummaryCards
        balanceCents={totals.balance}
        incomeCents={totals.income}
        expensesCents={totals.expenses}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <CategoryBreakdown categories={categoryBreakdown} />
        <SixMonthTrend months={monthlyTrend} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[380px_1fr]">
        <QuickAdd categories={allCategories} />
        <section>
          <h2 className="mb-3 text-sm font-semibold text-gray-900">Recent Transactions</h2>
          <TransactionList transactions={recentTransactions} categories={allCategories} />
        </section>
      </div>
    </main>
  );
}
