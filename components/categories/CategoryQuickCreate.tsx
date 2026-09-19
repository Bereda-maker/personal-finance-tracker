"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/FormField";

interface Category {
  id: number;
  name: string;
  color: string;
}

const SUGGESTED_COLORS = [
  "#f97316", "#6366f1", "#0ea5e9", "#22c55e",
  "#ec4899", "#64748b", "#16a34a", "#e11d48",
];

/**
 * Lets the user create a category inline, without leaving the transaction
 * form. On success, the new category is selected automatically.
 */
export function CategoryQuickCreate({
  onCreated,
}: {
  onCreated: (category: Category) => void;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [color, setColor] = useState(SUGGESTED_COLORS[0]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!open) {
    return (
      <Button type="button" variant="ghost" className="text-xs" onClick={() => setOpen(true)}>
        + New category
      </Button>
    );
  }

  async function handleCreate() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, color }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not create category");
        return;
      }
      onCreated(data);
      setOpen(false);
      setName("");
    } catch {
      setError("Network error — please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mt-2 flex flex-col gap-2 rounded-md border border-gray-200 bg-gray-50 p-3">
      <TextField
        label="New category name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        error={error ?? undefined}
        autoFocus
      />
      <fieldset className="flex items-center gap-2">
        <legend className="text-xs text-gray-600">Color</legend>
        <div className="flex gap-1">
          {SUGGESTED_COLORS.map((c) => (
            <label key={c} className="relative">
              <input
                type="radio"
                name="new-category-color"
                value={c}
                checked={color === c}
                onChange={() => setColor(c)}
                className="peer sr-only"
              />
              <span
                aria-hidden
                className="block h-6 w-6 cursor-pointer rounded-full border-2 border-transparent peer-checked:border-gray-900 peer-focus-visible:ring-2 peer-focus-visible:ring-offset-1 peer-focus-visible:ring-gray-900"
                style={{ backgroundColor: c }}
              />
              <span className="sr-only">{c}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <div className="flex gap-2">
        <Button
          type="button"
          variant="primary"
          className="text-xs"
          onClick={handleCreate}
          disabled={submitting || name.trim().length === 0}
        >
          {submitting ? "Creating…" : "Create"}
        </Button>
        <Button type="button" variant="ghost" className="text-xs" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
