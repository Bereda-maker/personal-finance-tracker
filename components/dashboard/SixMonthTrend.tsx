import { Card } from "@/components/ui/Card";
import { formatCents } from "@/lib/money";

interface MonthTotal {
  month: string; // "YYYY-MM"
  totalCents: number;
}

function monthLabel(month: string) {
  const [year, m] = month.split("-").map(Number);
  return new Date(year, m - 1, 1).toLocaleDateString("en-US", { month: "short" });
}

/**
 * A plain, dependency-free bar chart. Each bar carries the amount as
 * visible text underneath it (not just bar height), and the whole chart
 * has a text alternative via aria-label, per accessibility requirements.
 */
export function SixMonthTrend({ months }: { months: MonthTotal[] }) {
  const max = Math.max(...months.map((m) => m.totalCents), 1);
  const summary = months
    .map((m) => `${monthLabel(m.month)}: ${formatCents(m.totalCents)}`)
    .join(", ");

  return (
    <Card>
      <h2 className="text-sm font-semibold text-gray-900">Six-Month Spending Trend</h2>
      <div
        className="mt-6 flex items-end justify-between gap-2"
        role="img"
        aria-label={`Monthly spending: ${summary}`}
      >
        {months.map((m) => {
          const heightPct = Math.max((m.totalCents / max) * 100, 2);
          return (
            <div key={m.month} className="flex flex-1 flex-col items-center gap-2">
              <div className="flex h-32 w-full items-end">
                <div
                  className="w-full rounded-t-sm bg-gray-900"
                  style={{ height: `${heightPct}%` }}
                />
              </div>
              <p className="text-xs font-medium text-gray-500">{monthLabel(m.month)}</p>
              <p className="text-xs tabular-nums text-gray-700">{formatCents(m.totalCents)}</p>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
