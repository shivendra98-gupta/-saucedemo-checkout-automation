/**
 * FILE: utils/price.utils.ts
 *
 * WHAT: Money helpers and the independent totals calculation.
 *
 * HOW : parseMoney('Item total: $29.99') -> 29.99, roundCurrency() (2 decimals without float errors),
 * formatMoney(29.99) -> '$29.99', calculateOrderTotals(prices, taxRate) -> { subtotal, tax, total }.
 *
 * USED BY: Page objects (reading prices), checkout.assertions.ts.
 *
 * See PROJECT_GUIDE.txt for how all files fit together.
 */
/** Extracts a dollar amount from UI text such as "Item total: $29.99" or "$7.99". */
export function parseMoney(text: string): number {
  const match = text.replace(/,/g, '').match(/\$\s?(\d+(?:\.\d{1,2})?)/);
  if (!match) throw new Error(`No dollar amount found in "${text}"`);
  return Number(match[1]);
}

/** Rounds to 2 decimals using half-up rounding (avoids 1.005 -> 1.00 float issues). */
export function roundCurrency(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function formatMoney(value: number): string {
  return `$${value.toFixed(2)}`;
}

export type OrderTotals = { subtotal: number; tax: number; total: number };

/** Independent oracle for the checkout totals: subtotal = sum(prices), tax = subtotal * rate. */
export function calculateOrderTotals(prices: number[], taxRate: number): OrderTotals {
  const subtotal = roundCurrency(prices.reduce((sum, p) => sum + p, 0));
  const tax = roundCurrency(subtotal * taxRate);
  const total = roundCurrency(subtotal + tax);
  return { subtotal, tax, total };
}
