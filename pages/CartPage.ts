/**
 * FILE: pages/CartPage.ts
 *
 * WHAT: Page object for 'Your Cart'.
 *
 * HOW : cartItems (CartItemList), removeItem(name), checkout(), continueShopping().
 *
 * USED BY: cart.spec.ts, checkout.spec.ts, order-pdf.spec.ts.
 *
 * See PROJECT_GUIDE.txt for how all files fit together.
 */
import { expect, type Locator, type Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { CartItemList } from './components/CartItemList';
import { Routes } from '../config/routes';

export class CartPage extends BasePage {
  protected readonly path = Routes.cart;

  readonly cartItems: CartItemList;
  readonly checkoutButton: Locator;
  readonly continueShoppingButton: Locator;

  constructor(page: Page) {
    super(page);
    this.cartItems = new CartItemList(page);
    this.checkoutButton = page.getByTestId('checkout');
    this.continueShoppingButton = page.getByTestId('continue-shopping');
  }

  async expectLoaded(): Promise<void> {
    await super.expectLoaded('Your Cart');
  }

  async removeItem(name: string): Promise<void> {
    const item = this.cartItems.item(name);
    await item.getByRole('button', { name: 'Remove' }).click();
    await expect(item).toHaveCount(0);
  }

  async checkout(): Promise<void> {
    await this.checkoutButton.click();
  }

  async continueShopping(): Promise<void> {
    await this.continueShoppingButton.click();
  }
}
