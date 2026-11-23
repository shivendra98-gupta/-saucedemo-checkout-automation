/**
 * FILE: pages/components/CartItemList.ts
 *
 * WHAT: The list of products shown on the Cart page AND the Checkout Overview page (shared, not duplicated).
 *
 * HOW : readItems() reads name, price and quantity of each row; expectItems() asserts the list equals the expected
 * products in any order.
 *
 * USED BY: CartPage, CheckoutOverviewPage, checkout.assertions.ts.
 *
 * See PROJECT_GUIDE.txt for how all files fit together.
 */
import { expect, type Locator, type Page } from '@playwright/test';
import { parseMoney } from '../../utils/price.utils';

export type LineItem = { name: string; price: number; quantity: number };

/** Item list rendered on both the Cart and Checkout Overview pages. */
export class CartItemList {
  readonly items: Locator;

  constructor(page: Page) {
    this.items = page.getByTestId('cart-list').getByTestId('inventory-item');
  }

  item(name: string): Locator {
    return this.items.filter({
      has: this.items.page().getByTestId('inventory-item-name').getByText(name, { exact: true }),
    });
  }

  async readItems(): Promise<LineItem[]> {
    const rows = await this.items.all();
    return Promise.all(
      rows.map(async (row) => ({
        name: (await row.getByTestId('inventory-item-name').innerText()).trim(),
        price: parseMoney(await row.getByTestId('inventory-item-price').innerText()),
        quantity: Number(await row.getByTestId('item-quantity').innerText()),
      })),
    );
  }

  async expectItems(expected: { name: string; price: number }[]): Promise<void> {
    await expect(this.items).toHaveCount(expected.length);
    const actual = await this.readItems();
    expect(sortByName(actual)).toEqual(
      sortByName(expected.map((e) => ({ name: e.name, price: e.price, quantity: 1 }))),
    );
  }
}

const sortByName = <T extends { name: string }>(items: T[]) =>
  [...items].sort((a, b) => a.name.localeCompare(b.name));
