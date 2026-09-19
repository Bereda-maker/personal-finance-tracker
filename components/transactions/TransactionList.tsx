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
      const res = await fetch(`/api/transactions/${deletingId}`, {
        method: "DELETE",
      });
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
      <Card className="text-center text-sm" style={{ color: "var(--text-muted)" }}>
        No transactions yet. Add your first one above to get started.
      </Card>
    );
  }

  return (
    <Card className="p-0">
      <p role="status" aria-live="polite" className="sr-only">
        {statusMessage}
      </p>

      <ul className="transaction-list" aria-label="Recent transactions">
        {transactions.map((t) => (
          <li key={t.id} className="transaction-row">
            {editingId === t.id ? (
              /* ---------- Edit mode ---------- */
              <div className="col-span-full rounded-md p-3" style={{ background: "var(--surface-2)" }}>
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
              /* ---------- View mode ---------- */
              <>
                {/* Left: category icon */}
                <span
                  aria-hidden
                  className="category-icon"
                  style={{
                    backgroundColor: `${t.categoryColor}22`,
                    color: t.categoryColor,
                  }}
                >
                  {t.categoryName.charAt(0).toUpperCase()}
                </span>

                {/* Middle: title + meta + amount */}
                <div className="transaction-main">
                  <span className="transaction-title">
                    {t.note || t.categoryName}
                  </span>
                  <span className="transaction-meta">
                    {t.categoryName} · {formatDate(t.occurredAt)}
                  </span>
                  <span
                    className={`amount ${
                      t.type === "income" ? "amount-income" : "amount-expense"
                    }`}
                  >
                    {t.type === "income" ? "+" : "−"}
                    {formatCents(t.amountCents)}
                  </span>
                </div>

                {/* Right: actions */}
                <div className="transaction-actions">
                  <Button
                    variant="ghost"
                    className="action-edit"
                    onClick={() => setEditingId(t.id)}
                    aria-label={`Edit transaction: ${t.note || t.categoryName}`}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    className="action-delete"
                    onClick={() => setDeletingId(t.id)}
                    aria-label={`Delete transaction: ${t.note || t.categoryName}`}
                  >
                    Delete
                  </Button>
                </div>
              </>
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
