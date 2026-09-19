import { formatCents } from "@/lib/money";

export function SummaryCards({
  balanceCents,
  incomeCents,
  expensesCents,
}: {
  balanceCents: number;
  incomeCents: number;
  expensesCents: number;
}) {
  const savingsRate =
    incomeCents > 0
      ? Math.round(((incomeCents - expensesCents) / incomeCents) * 100)
      : 0;

  const trendUp = savingsRate >= 0;

  return (
    <section className="grid grid-cols-1 gap-5 md:grid-cols-3">
      {/* ===== Hero balance card ===== */}
      <div className="balance-card md:col-span-2">
        <p className="balance-label">Total Balance</p>
        <p className="balance-value">{formatCents(balanceCents)}</p>

        <div className="mt-4 flex items-center gap-2 text-sm">
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-semibold ${
              trendUp
                ? "bg-emerald-400/15 text-emerald-300"
                : "bg-red-400/15 text-red-300"
            }`}
          >
            <span aria-hidden>{trendUp ? "▲" : "▼"}</span>
            {Math.abs(savingsRate)}%
          </span>
          <span className="text-white/60">savings rate this month</span>
        </div>
      </div>

      {/* ===== Stat column ===== */}
      <div className="flex flex-col gap-5">
        <div className="stat-card stat-card--income">
          <div className="stat-icon stat-icon--income" aria-hidden>
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 19V5M5 12l7-7 7 7" />
            </svg>
          </div>
          <p className="stat-label">Income</p>
          <p className="stat-value stat-value--income">
            {formatCents(incomeCents)}
          </p>
        </div>

        <div className="stat-card stat-card--expense">
          <div className="stat-icon stat-icon--expense" aria-hidden>
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 5v14M19 12l-7 7-7-7" />
            </svg>
          </div>
          <p className="stat-label">Expenses</p>
          <p className="stat-value stat-value--expense">
            {formatCents(expensesCents)}
          </p>
        </div>
      </div>
    </section>
  );
}
