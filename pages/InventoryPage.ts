/**
 * FILE: pages/InventoryPage.ts
 *
 * WHAT: Page object for the Products (inventory) page.
 *
 * HOW : Finds a product card by its VISIBLE NAME, so tests survive id changes. addToCart(...names),
 * removeFromCart(...names), productPrice(name), openProductDetails(name), sortBy(option), allNames(), allPrices().
 *
 * USED BY: Most specs (via the loggedIn fixture).
 *
 * See PROJECT_GUIDE.txt for how all files fit together.
 */
import { expect, type Locator, type Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { Routes } from '../config/routes';
import { parseMoney } from '../utils/price.utils';

export type SortOption = 'az' | 'za' | 'lohi' | 'hilo';

export class InventoryPage extends BasePage {
  protected readonly path = Routes.inventory;

  readonly inventoryItems: Locator;
  readonly itemNames: Locator;
  readonly itemPrices: Locator;
  readonly sortDropdown: Locator;

  constructor(page: Page) {
    super(page);
    this.inventoryItems = page.getByTestId('inventory-list').getByTestId('inventory-item');
    this.itemNames = page.getByTestId('inventory-item-name');
    this.itemPrices = page.getByTestId('inventory-item-price');
    this.sortDropdown = page.getByTestId('product-sort-container');
  }

  async expectLoaded(): Promise<void> {
    await super.expectLoaded('Products');
    await expect(this.inventoryItems.first()).toBeVisible();
  }

  /** Product card located by its visible name - robust to id/slug changes. */
  productCard(name: string): Locator {
    return this.inventoryItems.filter({
      has: this.page.getByTestId('inventory-item-name').getByText(name, { exact: true }),
    });
  }

  addToCartButton(name: string): Locator {
    return this.productCard(name).getByRole('button', { name: 'Add to cart' });
  }

  removeButton(name: string): Locator {
    return this.productCard(name).getByRole('button', { name: 'Remove' });
  }

  async addToCart(...names: string[]): Promise<void> {
    for (const name of names) {
      await this.addToCartButton(name).click();
      await expect(this.removeButton(name)).toBeVisible();
    }
  }

  async removeFromCart(...names: string[]): Promise<void> {
    for (const name of names) {
      await this.removeButton(name).click();
      await expect(this.addToCartButton(name)).toBeVisible();
    }
  }

  async productPrice(name: string): Promise<number> {
    return parseMoney(await this.productCard(name).getByTestId('inventory-item-price').innerText());
  }

  async openProductDetails(name: string): Promise<void> {
    await this.productCard(name).getByTestId('inventory-item-name').click();
  }

  async sortBy(option: SortOption): Promise<void> {
    await this.sortDropdown.selectOption(option);
  }

  async allNames(): Promise<string[]> {
    return (await this.itemNames.allInnerTexts()).map((t) => t.trim());
  }

  async allPrices(): Promise<number[]> {
    return (await this.itemPrices.allInnerTexts()).map(parseMoney);
  }
}
