/**
 * FILE: pages/ProductDetailsPage.ts
 *
 * WHAT: Page object for a single product's details page.
 *
 * HOW : expectProduct(name, price), addToCart(), backToProducts().
 *
 * USED BY: cart.spec.ts.
 *
 * See PROJECT_GUIDE.txt for how all files fit together.
 */
import { expect, type Locator, type Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { Routes } from '../config/routes';
import { parseMoney } from '../utils/price.utils';

export class ProductDetailsPage extends BasePage {
  protected readonly path = Routes.inventory.replace('.html', '-item.html');

  readonly name: Locator;
  readonly price: Locator;
  readonly addToCartButton: Locator;
  readonly removeButton: Locator;
  readonly backButton: Locator;

  constructor(page: Page) {
    super(page);
    this.name = page.getByTestId('inventory-item-name');
    this.price = page.getByTestId('inventory-item-price');
    this.addToCartButton = page.getByTestId('add-to-cart');
    this.removeButton = page.getByTestId('remove');
    this.backButton = page.getByTestId('back-to-products');
  }

  async expectProduct(name: string, price: number): Promise<void> {
    await expect(this.name).toHaveText(name);
    expect(parseMoney(await this.price.innerText())).toBe(price);
  }

  async addToCart(): Promise<void> {
    await this.addToCartButton.click();
    await expect(this.removeButton).toBeVisible();
  }

  async backToProducts(): Promise<void> {
    await this.backButton.click();
  }
}
