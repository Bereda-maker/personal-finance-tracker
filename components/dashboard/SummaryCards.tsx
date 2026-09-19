import { Card } from "@/components/ui/Card";
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
  const items = [
    { label: "Balance", value: balanceCents, tone: balanceCents >= 0 ? "text-gray-900" : "text-red-600" },
    { label: "Income", value: incomeCents, tone: "text-green-600" },
    { label: "Expenses", value: expensesCents, tone: "text-gray-900" },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {items.map((item) => (
        <Card key={item.label}>
          <p className="text-sm font-medium text-gray-500">{item.label}</p>
          <p className={`mt-1 text-2xl font-semibold tabular-nums ${item.tone}`}>
            {formatCents(item.value)}
          </p>
        </Card>
      ))}
    </div>
  );
}
