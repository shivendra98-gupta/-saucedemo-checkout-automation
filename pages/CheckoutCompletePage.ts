/**
 * FILE: pages/CheckoutCompletePage.ts
 *
 * WHAT: Page object for 'Checkout: Complete!' (thank-you message, image, Back Home, Generate PDF order).
 *
 * HOW : downloadOrderPdf() clicks 'Generate PDF order' and waits for the browser download. The PDF is built
 * in the browser, so it allows NAVIGATION_TIMEOUT.
 *
 * USED BY: checkout.assertions.ts (expectOrderConfirmation), order-pdf.spec.ts.
 *
 * See PROJECT_GUIDE.txt for how all files fit together.
 */
import { expect, type Download, type Locator, type Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { Routes } from '../config/routes';
import { envConfig } from '../config/env.config';

export class CheckoutCompletePage extends BasePage {
  protected readonly path = Routes.checkoutComplete;

  readonly completeHeader: Locator;
  readonly completeText: Locator;
  readonly ponyExpressImage: Locator;
  readonly backHomeButton: Locator;
  readonly generatePdfButton: Locator;

  constructor(page: Page) {
    super(page);
    this.completeHeader = page.getByTestId('complete-header');
    this.completeText = page.getByTestId('complete-text');
    this.ponyExpressImage = page.getByTestId('pony-express');
    this.backHomeButton = page.getByTestId('back-to-products');
    this.generatePdfButton = page.getByTestId('generate-pdf-order');
  }

  async expectLoaded(): Promise<void> {
    await super.expectLoaded('Checkout: Complete!');
  }

  /** Clicks "Generate PDF order" and returns the resulting browser download. */
  async downloadOrderPdf(): Promise<Download> {
    await expect(this.generatePdfButton).toBeEnabled();
    const [download] = await Promise.all([
      // The PDF is rendered client-side by react-pdf, which can be slow on busy machines.
      this.page.waitForEvent('download', { timeout: envConfig.navigationTimeout }),
      this.generatePdfButton.click(),
    ]);
    return download;
  }

  async backHome(): Promise<void> {
    await this.backHomeButton.click();
  }
}
