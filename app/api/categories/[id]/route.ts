import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { categories, transactions } from "@/db/schema";
import { categoryInputSchema, idParamSchema } from "@/lib/validation";
import { ApiError, errorResponse } from "@/lib/api-errors";

type Params = { params: Promise<{ id: string }> };

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const { id: rawId } = await params;
    const id = idParamSchema.parse(rawId);
    const body = await req.json();
    const input = categoryInputSchema.parse(body);

    const [updated] = await db
      .update(categories)
      .set(input)
      .where(eq(categories.id, id))
      .returning();

    if (!updated) {
      throw new ApiError("Category not found", 404);
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

    const [inUse] = await db
      .select({ id: transactions.id })
      .from(transactions)
      .where(eq(transactions.categoryId, id))
      .limit(1);

    if (inUse) {
      throw new ApiError(
        "This category has transactions and can't be deleted. Reassign or delete those transactions first.",
        409,
      );
    }

    const [deleted] = await db
      .delete(categories)
      .where(eq(categories.id, id))
      .returning();

    if (!deleted) {
      throw new ApiError("Category not found", 404);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
