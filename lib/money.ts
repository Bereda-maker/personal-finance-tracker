/**
 * Money utilities.
 *
 * The database and all business logic work exclusively in integer cents.
 * Floats are never used for money — they cannot represent values like
 * $0.10 exactly in binary, which silently corrupts totals over time.
 * Conversion to/from a human "dollars" representation only happens here,
 * at the boundary to the UI.
 */

/** Converts integer cents to a dollars-and-cents number (e.g. 1250 -> 12.5). */
export function centsToCurrency(cents: number): number {
  if (!Number.isInteger(cents)) {
    throw new Error(`centsToCurrency expected an integer, got ${cents}`);
  }
  return cents / 100;
}

/**
 * Converts a dollars amount (e.g. from a form input) to integer cents.
 * Rounds to the nearest cent to avoid floating-point artifacts like
 * 12.1 * 100 === 1209.9999999999998.
 */
export function currencyToCents(amount: number): number {
  if (!Number.isFinite(amount)) {
    throw new Error(`currencyToCents expected a finite number, got ${amount}`);
  }
  return Math.round(amount * 100);
}

/**
 * Formats integer cents as a localized currency string.
 * formatCents(1250)  -> "$12.50"
 * formatCents(-500)  -> "-$5.00"
 */
export function formatCents(
  cents: number,
  options: { currency?: string; locale?: string } = {},
): string {
  const { currency = "USD", locale = "en-US" } = options;
  const dollars = centsToCurrency(cents);
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
  }).format(dollars);
}
