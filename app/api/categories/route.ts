import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import { categories } from "@/db/schema";
import { categoryInputSchema } from "@/lib/validation";
import { errorResponse } from "@/lib/api-errors";
import { asc } from "drizzle-orm";

export async function GET() {
  try {
    const rows = await db.select().from(categories).orderBy(asc(categories.name));
    return NextResponse.json(rows);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const input = categoryInputSchema.parse(body);

    const [created] = await db.insert(categories).values(input).returning();
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
