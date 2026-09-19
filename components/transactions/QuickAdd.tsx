"use client";

import { Card } from "@/components/ui/Card";
import { emptyTransactionValues, TransactionForm } from "@/components/transactions/TransactionForm";

interface Category {
  id: number;
  name: string;
  color: string;
}

export function QuickAdd({ categories }: { categories: Category[] }) {
  return (
    <Card>
      <h2 className="text-sm font-semibold text-gray-900">Add a Transaction</h2>
      <div className="mt-4">
        <TransactionForm categories={categories} initialValues={emptyTransactionValues()} />
      </div>
    </Card>
  );
}
