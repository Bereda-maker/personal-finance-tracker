import { NextRequest, NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { categories, transactions } from "@/db/schema";
import { transactionInputSchema } from "@/lib/validation";
import { currencyToCents } from "@/lib/money";
import { ApiError, errorResponse } from "@/lib/api-errors";

const MAX_LIMIT = 200;
const DEFAULT_LIMIT = 50;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = Math.min(
      Number(searchParams.get("limit")) || DEFAULT_LIMIT,
      MAX_LIMIT,
    );
    const offset = Math.max(Number(searchParams.get("offset")) || 0, 0);

    const rows = await db
      .select({
        id: transactions.id,
        amountCents: transactions.amountCents,
        type: transactions.type,
        occurredAt: transactions.occurredAt,
        note: transactions.note,
        categoryId: transactions.categoryId,
        categoryName: categories.name,
        categoryColor: categories.color,
      })
      .from(transactions)
      .innerJoin(categories, eq(transactions.categoryId, categories.id))
      .orderBy(desc(transactions.occurredAt), desc(transactions.id))
      .limit(limit)
      .offset(offset);

    return NextResponse.json(rows);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(req: NextRequest) {
  try {
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

    const [created] = await db
      .insert(transactions)
      .values({
        amountCents: currencyToCents(input.amount),
        type: input.type,
        categoryId: input.categoryId,
        occurredAt: input.occurredAt,
        note: input.note || null,
      })
      .returning();

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
