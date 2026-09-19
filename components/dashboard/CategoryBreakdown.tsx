import { Card } from "@/components/ui/Card";
import { formatCents } from "@/lib/money";

interface CategoryTotal {
  categoryId: number;
  name: string;
  color: string;
  totalCents: number;
}

export function CategoryBreakdown({ categories }: { categories: CategoryTotal[] }) {
  const spending = categories.filter((c) => c.totalCents > 0);
  const total = spending.reduce((sum, c) => sum + c.totalCents, 0);

  return (
    <Card>
      <h2 className="text-sm font-semibold text-gray-900">Spending by Category</h2>

      {spending.length === 0 ? (
        <p className="mt-4 text-sm text-gray-500">
          No expenses recorded yet. Categories will appear here once you add some.
        </p>
      ) : (
        <ul className="mt-4 flex flex-col gap-3">
          {spending.map((c) => {
            const pct = total > 0 ? Math.round((c.totalCents / total) * 100) : 0;
            return (
              <li key={c.categoryId}>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 font-medium text-gray-900">
                    <span
                      aria-hidden
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: c.color }}
                    />
                    {c.name}
                  </span>
                  <span className="tabular-nums text-gray-600">
                    {formatCents(c.totalCents)} · {pct}%
                  </span>
                </div>
                <div
                  className="mt-1 h-2 w-full overflow-hidden rounded-full bg-gray-100"
                  role="img"
                  aria-label={`${c.name}: ${formatCents(c.totalCents)}, ${pct}% of spending`}
                >
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${pct}%`, backgroundColor: c.color }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
