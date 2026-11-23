/**
 * FILE: pages/CheckoutOverviewPage.ts
 *
 * WHAT: Page object for 'Checkout: Overview' (items, payment/shipping info, item total, tax, total).
 *
 * HOW : readTotals() converts the three price labels into numbers; finish() places the order; cancel().
 *
 * USED BY: checkout.assertions.ts (expectOrderTotals), checkout.spec.ts, order-pdf.spec.ts.
 *
 * See PROJECT_GUIDE.txt for how all files fit together.
 */
import { type Locator, type Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { CartItemList } from './components/CartItemList';
import { Routes } from '../config/routes';
import { parseMoney } from '../utils/price.utils';

export type DisplayedTotals = { subtotal: number; tax: number; total: number };

export class CheckoutOverviewPage extends BasePage {
  protected readonly path = Routes.checkoutOverview;

  readonly cartItems: CartItemList;
  readonly paymentInfo: Locator;
  readonly shippingInfo: Locator;
  readonly subtotalLabel: Locator;
  readonly taxLabel: Locator;
  readonly totalLabel: Locator;
  readonly finishButton: Locator;
  readonly cancelButton: Locator;

  constructor(page: Page) {
    super(page);
    this.cartItems = new CartItemList(page);
    this.paymentInfo = page.getByTestId('payment-info-value');
    this.shippingInfo = page.getByTestId('shipping-info-value');
    this.subtotalLabel = page.getByTestId('subtotal-label');
    this.taxLabel = page.getByTestId('tax-label');
    this.totalLabel = page.getByTestId('total-label');
    this.finishButton = page.getByTestId('finish');
    this.cancelButton = page.getByTestId('cancel');
  }

  async expectLoaded(): Promise<void> {
    await super.expectLoaded('Checkout: Overview');
  }

  async readTotals(): Promise<DisplayedTotals> {
    return {
      subtotal: parseMoney(await this.subtotalLabel.innerText()),
      tax: parseMoney(await this.taxLabel.innerText()),
      total: parseMoney(await this.totalLabel.innerText()),
    };
  }

  async finish(): Promise<void> {
    await this.finishButton.click();
  }

  async cancel(): Promise<void> {
    await this.cancelButton.click();
  }
}
