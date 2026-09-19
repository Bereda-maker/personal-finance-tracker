"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { SelectField, TextareaField, TextField } from "@/components/ui/FormField";
import { CategoryQuickCreate } from "@/components/categories/CategoryQuickCreate";
import { centsToCurrency } from "@/lib/money";

interface Category {
  id: number;
  name: string;
  color: string;
}

export interface TransactionFormValues {
  id?: number;
  amount: string;
  type: "income" | "expense";
  categoryId: string;
  occurredAt: string;
  note: string;
}

function toDateInputValue(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function emptyTransactionValues(): TransactionFormValues {
  return {
    amount: "",
    type: "expense",
    categoryId: "",
    occurredAt: toDateInputValue(new Date()),
    note: "",
  };
}

export function transactionToFormValues(t: {
  id: number;
  amountCents: number;
  type: "income" | "expense";
  categoryId: number;
  occurredAt: Date | string;
  note: string | null;
}): TransactionFormValues {
  return {
    id: t.id,
    amount: centsToCurrency(t.amountCents).toString(),
    type: t.type,
    categoryId: String(t.categoryId),
    occurredAt: toDateInputValue(new Date(t.occurredAt)),
    note: t.note ?? "",
  };
}

interface TransactionFormProps {
  categories: Category[];
  initialValues: TransactionFormValues;
  onSuccess?: () => void;
  submitLabel?: string;
}

/**
 * Shared by both "Quick Add" on the dashboard and the edit-transaction flow.
 * Client-side validation here is for immediate feedback; the server (see
 * app/api/transactions) re-validates everything independently.
 */
export function TransactionForm({
  categories,
  initialValues,
  onSuccess,
  submitLabel = "Add transaction",
}: TransactionFormProps) {
  const router = useRouter();
  const [values, setValues] = useState(initialValues);
  const [localCategories, setLocalCategories] = useState(categories);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  function update<K extends keyof TransactionFormValues>(key: K, value: TransactionFormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);
    setErrors({});

    const amountNumber = Number(values.amount);
    const payload = {
      amount: amountNumber,
      type: values.type,
      categoryId: Number(values.categoryId),
      occurredAt: values.occurredAt,
      note: values.note,
    };

    const isEdit = typeof values.id === "number";
    const url = isEdit ? `/api/transactions/${values.id}` : "/api/transactions";
    const method = isEdit ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) {
        if (data.issues) {
          const fieldErrors: Record<string, string> = {};
          for (const issue of data.issues) {
            const field = issue.path?.[0];
            if (field) fieldErrors[field] = issue.message;
          }
          setErrors(fieldErrors);
        }
        setFormError(data.error ?? "Something went wrong.");
        return;
      }

      if (!isEdit) {
        setValues(emptyTransactionValues());
      }
      router.refresh();
      onSuccess?.();
    } catch {
      setFormError("Network error — please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      {formError && (
        <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
          {formError}
        </p>
      )}

      <div className="grid grid-cols-2 gap-3">
        <SelectField
          label="Type"
          value={values.type}
          onChange={(e) => update("type", e.target.value as "income" | "expense")}
        >
          <option value="expense">Expense</option>
          <option value="income">Income</option>
        </SelectField>

        <TextField
          label="Amount"
          type="number"
          inputMode="decimal"
          step="0.01"
          min="0"
          placeholder="0.00"
          value={values.amount}
          onChange={(e) => update("amount", e.target.value)}
          error={errors.amount}
          required
        />
      </div>

      <div>
        <SelectField
          label="Category"
          value={values.categoryId}
          onChange={(e) => update("categoryId", e.target.value)}
          error={errors.categoryId}
          required
        >
          <option value="" disabled>
            Select a category…
          </option>
          {localCategories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </SelectField>
        <CategoryQuickCreate
          onCreated={(cat) => {
            setLocalCategories((prev) =>
              [...prev, cat].sort((a, b) => a.name.localeCompare(b.name)),
            );
            update("categoryId", String(cat.id));
          }}
        />
      </div>

      <TextField
        label="Date"
        type="date"
        value={values.occurredAt}
        onChange={(e) => update("occurredAt", e.target.value)}
        error={errors.occurredAt}
        required
      />

      <TextareaField
        label="Note (optional)"
        rows={2}
        maxLength={280}
        value={values.note}
        onChange={(e) => update("note", e.target.value)}
        error={errors.note}
      />

      <Button type="submit" disabled={submitting}>
        {submitting ? "Saving…" : submitLabel}
      </Button>
    </form>
  );
}
