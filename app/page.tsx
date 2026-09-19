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

export const dynamic = "force-dynamic";

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
    <main id="main-content" className="app-shell">
      {/* ===== Header ===== */}
      <header className="app-header animate-fade-up">
        <div>
          <h1 className="app-title">Personal Finance</h1>
          <p className="app-subtitle">
            Every dollar accounted for. Live from your database.
          </p>
        </div>
      </header>

      {/* ===== Hero + Stat cards ===== */}
      <SummaryCards
        balanceCents={totals.balance}
        incomeCents={totals.income}
        expensesCents={totals.expenses}
      />

      {/* ===== Charts ===== */}
      <div className="mt-8 grid grid-cols-1 gap-6 animate-fade-up-delay-2 lg:grid-cols-2">
        <CategoryBreakdown categories={categoryBreakdown} />
        <SixMonthTrend months={monthlyTrend} />
      </div>

      {/* ===== Quick Add + Transactions ===== */}
      <div className="mt-8 grid grid-cols-1 gap-6 animate-fade-up-delay-3 lg:grid-cols-[380px_1fr]">
        <QuickAdd categories={allCategories} />

        <section>
          <div className="mb-4 flex items-baseline justify-between">
            <div>
              <h2 className="section-title">Recent Transactions</h2>
              <p className="section-subtitle">Your latest activity</p>
            </div>
          </div>
          <TransactionList
            transactions={recentTransactions}
            categories={allCategories}
          />
        </section>
      </div>
    </main>
  );
}
