import { NextResponse } from "next/server";
import { ZodError } from "zod";

/**
 * Shared error-shaping so every API route returns the same structure:
 *   { error: string, issues?: [...] }
 * Never leak raw exception messages/stack traces to the client.
 */
export function errorResponse(error: unknown) {
  if (error instanceof ZodError) {
    return NextResponse.json(
      { error: "Invalid input", issues: error.issues },
      { status: 400 },
    );
  }

  if (error instanceof ApiError) {
    return NextResponse.json(
      { error: error.message },
      { status: error.status },
    );
  }

  console.error("Unexpected API error:", error);
  return NextResponse.json(
    { error: "Something went wrong. Please try again." },
    { status: 500 },
  );
}

/** Thrown by route handlers for expected, named error cases (404, 409, etc). */
export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}
