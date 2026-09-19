import { describe, expect, it } from "vitest";
import { centsToCurrency, currencyToCents, formatCents } from "@/lib/money";

describe("centsToCurrency", () => {
  it("converts integer cents to dollars", () => {
    expect(centsToCurrency(1250)).toBe(12.5);
    expect(centsToCurrency(0)).toBe(0);
    expect(centsToCurrency(-500)).toBe(-5);
  });

  it("throws on non-integer input", () => {
    expect(() => centsToCurrency(12.5)).toThrow();
  });
});

describe("currencyToCents", () => {
  it("converts dollars to integer cents", () => {
    expect(currencyToCents(12.5)).toBe(1250);
    expect(currencyToCents(100)).toBe(10000);
    expect(currencyToCents(5.75)).toBe(575);
  });

  it("rounds to the nearest cent to avoid float artifacts", () => {
    // 12.1 * 100 is 1209.9999999999998 in raw floating point.
    expect(currencyToCents(12.1)).toBe(1210);
  });

  it("throws on non-finite input", () => {
    expect(() => currencyToCents(NaN)).toThrow();
    expect(() => currencyToCents(Infinity)).toThrow();
  });
});

describe("formatCents", () => {
  it("formats positive amounts", () => {
    expect(formatCents(1250)).toBe("$12.50");
  });

  it("formats negative amounts", () => {
    expect(formatCents(-500)).toBe("-$5.00");
  });

  it("formats zero", () => {
    expect(formatCents(0)).toBe("$0.00");
  });

  it("pads to two decimal places", () => {
    expect(formatCents(100)).toBe("$1.00");
  });

  it("round-trips through currencyToCents", () => {
    const cents = currencyToCents(42.5);
    expect(formatCents(cents)).toBe("$42.50");
  });
});
