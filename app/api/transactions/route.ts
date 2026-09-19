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
    // ---- Step 1: read body ----
    const body = await req.json();
    console.log("[POST /api/transactions] raw body:", JSON.stringify(body));

    // ---- Step 2: validate ----
    const input = transactionInputSchema.parse(body);
    console.log("[POST /api/transactions] parsed input:", {
      amount: input.amount,
      amountType: typeof input.amount,
      type: input.type,
      categoryId: input.categoryId,
      categoryIdType: typeof input.categoryId,
      occurredAt: input.occurredAt,
      occurredAtIsDate: input.occurredAt instanceof Date,
      occurredAtValid: !isNaN(input.occurredAt.getTime()),
      note: input.note,
    });

    // ---- Step 3: verify category exists ----
    const [category] = await db
      .select({ id: categories.id })
      .from(categories)
      .where(eq(categories.id, input.categoryId))
      .limit(1);

    if (!category) {
      throw new ApiError("Category does not exist", 400);
    }

    // ---- Step 4: build insert values ----
    const amountCents = currencyToCents(input.amount);
    console.log(
      "[POST /api/transactions] amountCents:",
      amountCents,
      typeof amountCents,
    );

    const insertValues = {
      amountCents,
      type: input.type,
      categoryId: input.categoryId,
      occurredAt: input.occurredAt,
      note: input.note && input.note.length > 0 ? input.note : null,
    };
    console.log(
      "[POST /api/transactions] insert values:",
      JSON.stringify(insertValues),
    );

    // ---- Step 5: insert ----
    const [created] = await db
      .insert(transactions)
      .values(insertValues)
      .returning();

    console.log("[POST /api/transactions] created:", created);
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
