/**
 * FILE: pages/CheckoutInformationPage.ts
 *
 * WHAT: Page object for 'Checkout: Your Information' (first name, last name, postal code).
 *
 * HOW : fillCustomerInformation(customer), submit(customer) = fill + Continue, expectError(msg), dismissError(), cancel().
 *
 * USED BY: checkout.spec.ts, order-pdf.spec.ts.
 *
 * See PROJECT_GUIDE.txt for how all files fit together.
 */
import { expect, type Locator, type Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { Routes } from '../config/routes';
import type { Customer } from '../test-data';

export class CheckoutInformationPage extends BasePage {
  protected readonly path = Routes.checkoutInformation;

  readonly firstNameInput: Locator;
  readonly lastNameInput: Locator;
  readonly postalCodeInput: Locator;
  readonly continueButton: Locator;
  readonly cancelButton: Locator;
  readonly errorMessage: Locator;
  readonly errorCloseButton: Locator;

  constructor(page: Page) {
    super(page);
    this.firstNameInput = page.getByTestId('firstName');
    this.lastNameInput = page.getByTestId('lastName');
    this.postalCodeInput = page.getByTestId('postalCode');
    this.continueButton = page.getByTestId('continue');
    this.cancelButton = page.getByTestId('cancel');
    this.errorMessage = page.getByTestId('error');
    this.errorCloseButton = page.getByTestId('error-button');
  }

  async expectLoaded(): Promise<void> {
    await super.expectLoaded('Checkout: Your Information');
  }

  async fillCustomerInformation(customer: Customer): Promise<void> {
    await this.firstNameInput.fill(customer.firstName);
    await this.lastNameInput.fill(customer.lastName);
    await this.postalCodeInput.fill(customer.postalCode);
  }

  async submit(customer: Customer): Promise<void> {
    await this.fillCustomerInformation(customer);
    await this.continueButton.click();
  }

  async expectError(message: string): Promise<void> {
    await expect(this.errorMessage).toHaveText(message);
  }

  async dismissError(): Promise<void> {
    await this.errorCloseButton.click();
    await expect(this.errorMessage).toBeHidden();
  }

  async cancel(): Promise<void> {
    await this.cancelButton.click();
  }
}
