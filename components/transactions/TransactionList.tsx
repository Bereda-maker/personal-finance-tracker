"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { formatCents } from "@/lib/money";
import {
  TransactionForm,
  transactionToFormValues,
} from "@/components/transactions/TransactionForm";

interface Category {
  id: number;
  name: string;
  color: string;
}

interface TransactionRow {
  id: number;
  amountCents: number;
  type: "income" | "expense";
  occurredAt: string | Date;
  note: string | null;
  categoryId: number;
  categoryName: string;
  categoryColor: string;
}

function formatDate(d: string | Date) {
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function TransactionList({
  transactions,
  categories,
}: {
  transactions: TransactionRow[];
  categories: Category[];
}) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  async function confirmDelete() {
    if (deletingId == null) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      const res = await fetch(`/api/transactions/${deletingId}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        setDeleteError(data.error ?? "Could not delete transaction.");
        return;
      }
      setDeletingId(null);
      setStatusMessage("Transaction deleted.");
      router.refresh();
    } catch {
      setDeleteError("Network error — please try again.");
    } finally {
      setIsDeleting(false);
    }
  }

  if (transactions.length === 0) {
    return (
      <Card className="text-center text-sm text-gray-500">
        No transactions yet. Add your first one above to get started.
      </Card>
    );
  }

  return (
    <Card className="p-0">
      <p role="status" aria-live="polite" className="sr-only">
        {statusMessage}
      </p>
      <ul className="divide-y divide-gray-100" aria-label="Recent transactions">
        {transactions.map((t) => (
          <li key={t.id} className="p-4">
            {editingId === t.id ? (
              <div className="rounded-md bg-gray-50 p-3">
                <TransactionForm
                  categories={categories}
                  initialValues={transactionToFormValues(t)}
                  submitLabel="Save changes"
                  onSuccess={() => setEditingId(null)}
                />
                <Button
                  type="button"
                  variant="ghost"
                  className="mt-2 text-xs"
                  onClick={() => setEditingId(null)}
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    aria-hidden
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: t.categoryColor }}
                  />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-gray-900">
                      {t.note || t.categoryName}
                    </p>
                    <p className="text-xs text-gray-500">
                      {t.categoryName} · {formatDate(t.occurredAt)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span
                    className={`text-sm font-semibold tabular-nums ${
                      t.type === "income" ? "text-green-600" : "text-gray-900"
                    }`}
                  >
                    {t.type === "income" ? "+" : "-"}
                    {formatCents(t.amountCents)}
                  </span>
                  <Button
                    variant="ghost"
                    className="text-xs"
                    onClick={() => setEditingId(t.id)}
                    aria-label={`Edit transaction: ${t.note || t.categoryName}`}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    className="text-xs text-red-600 hover:bg-red-50"
                    onClick={() => setDeletingId(t.id)}
                    aria-label={`Delete transaction: ${t.note || t.categoryName}`}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>

      <ConfirmDialog
        open={deletingId != null}
        title="Delete transaction?"
        description={deleteError ?? "This action can't be undone."}
        onConfirm={confirmDelete}
        onCancel={() => {
          setDeletingId(null);
          setDeleteError(null);
        }}
        isPending={isDeleting}
      />
    </Card>
  );
}
