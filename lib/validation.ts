import { z } from "zod";

/**
 * Shared Zod schemas. Used on the client for immediate form feedback, and
 * on the server (in the Route Handlers) as the source of truth — the
 * server never trusts that client-side validation actually ran.
 */

export const hexColorSchema = z
  .string()
  .regex(/^#([0-9a-fA-F]{6})$/, "Color must be a 6-digit hex code, e.g. #22c55e");

export const categoryInputSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(50, "Name must be 50 characters or fewer"),
  color: hexColorSchema,
});

export type CategoryInput = z.infer<typeof categoryInputSchema>;

export const transactionTypeSchema = z.enum(["income", "expense"]);

/**
 * Input shape as it arrives from a form: amount in whole dollars (a human
 * types "12.50"), converted to integer cents server-side before it ever
 * touches the database. See lib/money.ts.
 *
 * NOTE: `amount` and `categoryId` use z.coerce — form inputs always send
 * strings ("12.50", "3"), and without coercion Zod rejects them before the
 * request ever reaches the database.
 */
export const transactionInputSchema = z.object({
  amount: z.coerce
    .number({ error: "Amount is required" })
    .positive("Amount must be greater than zero")
    .max(1_000_000, "Amount is unreasonably large")
    .refine(
      (val) => Math.round(val * 100) === val * 100,
      "Amount cannot have more than 2 decimal places",
    ),
  type: transactionTypeSchema,
  categoryId: z.coerce
    .number({ error: "Category is required" })
    .int()
    .positive(),
  occurredAt: z.coerce.date({ error: "A valid date is required" }),
  note: z
    .string()
    .trim()
    .max(280, "Note must be 280 characters or fewer")
    .optional()
    .or(z.literal("")),
});

export type TransactionInput = z.infer<typeof transactionInputSchema>;

export const idParamSchema = z.coerce.number().int().positive();
