import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { categories, transactions } from "@/db/schema";
import { transactionInputSchema, idParamSchema } from "@/lib/validation";
import { currencyToCents } from "@/lib/money";
import { ApiError, errorResponse } from "@/lib/api-errors";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { id: rawId } = await params;
    const id = idParamSchema.parse(rawId);

    const [row] = await db
      .select()
      .from(transactions)
      .where(eq(transactions.id, id))
      .limit(1);

    if (!row) {
      throw new ApiError("Transaction not found", 404);
    }

    return NextResponse.json(row);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const { id: rawId } = await params;
    const id = idParamSchema.parse(rawId);
    const body = await req.json();
    const input = transactionInputSchema.parse(body);

    const [category] = await db
      .select({ id: categories.id })
      .from(categories)
      .where(eq(categories.id, input.categoryId))
      .limit(1);

    if (!category) {
      throw new ApiError("Category does not exist", 400);
    }

    const [updated] = await db
      .update(transactions)
      .set({
        amountCents: currencyToCents(input.amount),
        type: input.type,
        categoryId: input.categoryId,
        occurredAt: input.occurredAt,
        note: input.note || null,
      })
      .where(eq(transactions.id, id))
      .returning();

    if (!updated) {
      throw new ApiError("Transaction not found", 404);
    }

    return NextResponse.json(updated);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id: rawId } = await params;
    const id = idParamSchema.parse(rawId);

    const [deleted] = await db
      .delete(transactions)
      .where(eq(transactions.id, id))
      .returning();

    if (!deleted) {
      throw new ApiError("Transaction not found", 404);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
