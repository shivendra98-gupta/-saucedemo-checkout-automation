/**
 * FILE: assertions/checkout.assertions.ts
 *
 * WHAT: Reusable checks for the checkout overview totals, the confirmation page and the order PDF.
 *
 * HOW : expectOrderTotals() calculates subtotal, tax and total itself from the line items and compares them with the
 * page, with the test data and with each other, plus the exact 2-decimal label text. Uses soft assertions so
 * every mismatch is reported. expectOrderConfirmation() checks the thank-you page. expectOrderPdf() checks the
 * downloaded receipt's file name, size, pages, customer, items, prices, totals and message.
 *
 * USED BY: checkout.spec.ts, order-pdf.spec.ts.
 *
 * See PROJECT_GUIDE.txt for how all files fit together.
 */
import { expect } from '@playwright/test';
import type { CheckoutOverviewPage } from '../pages/CheckoutOverviewPage';
import type { CheckoutCompletePage } from '../pages/CheckoutCompletePage';
import { calculateOrderTotals, formatMoney, type OrderTotals } from '../utils/price.utils';
import { compact, type ParsedPdf } from '../utils/pdf.utils';
import { CheckoutData, type Customer } from '../test-data';
import { envConfig } from '../config/env.config';

/**
 * Validates the overview totals three ways:
 *  1. the line items shown match what was added to the cart,
 *  2. displayed subtotal/tax/total equal an independently computed oracle,
 *  3. the displayed values are internally consistent (subtotal + tax === total).
 */
export async function expectOrderTotals(
  overview: CheckoutOverviewPage,
  items: { name: string; price: number }[],
  taxRate: number,
  expected?: OrderTotals,
): Promise<OrderTotals> {
  await overview.cartItems.expectItems(items);

  const lineItemPrices = (await overview.cartItems.readItems()).map((i) => i.price * i.quantity);
  const computed = calculateOrderTotals(lineItemPrices, taxRate);
  const displayed = await overview.readTotals();

  expect.soft(displayed.subtotal, 'Item total equals sum of line items').toBe(computed.subtotal);
  expect.soft(displayed.tax, `Tax equals ${taxRate * 100}% of item total`).toBe(computed.tax);
  expect.soft(displayed.total, 'Total equals item total + tax').toBe(computed.total);
  expect
    .soft(Math.round((displayed.subtotal + displayed.tax) * 100), 'Displayed values are internally consistent')
    .toBe(Math.round(displayed.total * 100));

  if (expected) {
    expect.soft(displayed, 'Totals match expected values from test data').toEqual(expected);
  }

  // Exact label text also catches formatting defects such as "$59.980000000000004"
  await expect(overview.subtotalLabel).toHaveText(`Item total: ${formatMoney(computed.subtotal)}`);
  await expect(overview.taxLabel).toHaveText(`Tax: ${formatMoney(computed.tax)}`);
  await expect(overview.totalLabel).toHaveText(`Total: ${formatMoney(computed.total)}`);

  await expect(overview.paymentInfo).toHaveText(CheckoutData.orderInfo.paymentInfo);
  await expect(overview.shippingInfo).toHaveText(CheckoutData.orderInfo.shippingInfo);
  return displayed;
}

export async function expectOrderConfirmation(complete: CheckoutCompletePage): Promise<void> {
  const { confirmation } = CheckoutData;
  await complete.expectLoaded();
  await expect(complete.title).toHaveText(confirmation.title);
  await expect(complete.completeHeader).toHaveText(confirmation.header);
  await expect(complete.completeText).toHaveText(confirmation.text);
  // Image asset can load slowly; allow the navigation timeout for it to render.
  await expect(complete.ponyExpressImage).toBeVisible({ timeout: envConfig.navigationTimeout });
  await expect(complete.backHomeButton).toBeVisible();
  await complete.header.expectCartCount(0);
}

/** Validates the downloaded order-confirmation PDF against the order that was placed. */
export function expectOrderPdf(
  pdf: ParsedPdf,
  order: { customer: Customer; items: { name: string; price: number }[]; totals: OrderTotals },
): void {
  const text = compact(pdf.text);
  const has = (fragment: string) => text.includes(compact(fragment));

  expect(pdf.fileName, 'PDF file name').toMatch(/^swag-labs-order-\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}\.pdf$/);
  expect(pdf.sizeBytes, 'PDF is not empty').toBeGreaterThan(1000);
  expect(pdf.numPages, 'Receipt fits on one page').toBe(1);

  expect.soft(has('Swag Labs'), 'Brand name').toBe(true);
  expect.soft(has('Order Receipt'), 'Document title').toBe(true);
  expect.soft(has('Order Details'), 'Order details section').toBe(true);
  expect.soft(pdf.text, 'Order date').toMatch(new RegExp(`Order Date\\s*[A-Z][a-z]+ \\d{1,2}, ${new Date().getFullYear()}`));

  expect.soft(has('Ship To'), 'Ship-to section').toBe(true);
  expect.soft(has(`${order.customer.firstName} ${order.customer.lastName}`), 'Customer name').toBe(true);
  expect.soft(has(order.customer.postalCode), 'Postal code').toBe(true);

  for (const item of order.items) {
    expect.soft(has(`${item.name}${formatMoney(item.price)}`), `Line item "${item.name}" with price`).toBe(true);
  }

  expect.soft(has(`Item total${formatMoney(order.totals.subtotal)}`), 'Item total').toBe(true);
  expect.soft(has(`Tax${formatMoney(order.totals.tax)}`), 'Tax').toBe(true);
  expect.soft(text, 'Grand total').toMatch(new RegExp(`(?<!item)total${escape(formatMoney(order.totals.total))}`));
  expect.soft(has(CheckoutData.confirmation.pdfMessage), 'Confirmation message').toBe(true);
}

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
