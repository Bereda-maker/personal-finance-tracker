import { NextResponse } from "next/server";
import { ZodError } from "zod";

/**
 * Errors thrown intentionally by route handlers. Anything else that bubbles
 * up is treated as a 500 and logged server-side.
 */
export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number = 400) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

/**
 * Converts any thrown value into a NextResponse. Zod errors become 400s with
 * a structured `issues` array so the client can map errors back to fields.
 * ApiError becomes its own status. Everything else logs and returns 500.
 */
export function errorResponse(error: unknown): NextResponse {
  // Zod validation failure — 400 with per-field details
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        error: "Validation failed",
        issues: error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      },
      { status: 400 },
    );
  }

  // Deliberate API error (e.g. "Category does not exist")
  if (error instanceof ApiError) {
    return NextResponse.json(
      { error: error.message },
      { status: error.status },
    );
  }

  // Anything else — likely a bug or DB failure. Log the full picture so the
  // real error is visible in the terminal / Vercel function logs.
  const anyError = error as {
    message?: string;
    cause?: unknown;
    stack?: string;
  };

  console.error("Unexpected API error:");
  console.error("  message:", anyError?.message);
  console.error("  cause:  ", anyError?.cause);
  console.error("  stack:  ", anyError?.stack);

  return NextResponse.json(
    { error: "Internal server error" },
    { status: 500 },
  );
}
