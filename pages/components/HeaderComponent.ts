/**
 * FILE: pages/components/HeaderComponent.ts
 *
 * WHAT: The header shown on every logged-in page: cart icon, cart badge and burger menu.
 *
 * HOW : openCart(), expectCartCount(n), logout(), resetAppState(). Menu items are clicked through clickMenuItem(),
 * which waits for the menu panel's aria-hidden="false" and retries, because the closed menu is only
 * slid off-screen and some browsers ignore a click made right after a page load.
 *
 * USED BY: BasePage (every page has `.header`).
 *
 * See PROJECT_GUIDE.txt for how all files fit together.
 */
import { expect, type Locator, type Page } from '@playwright/test';

/** Header shared by all authenticated pages: cart icon/badge and burger menu. */
export class HeaderComponent {
  readonly cartLink: Locator;
  readonly cartBadge: Locator;
  readonly menuButton: Locator;
  /** Slide-out menu panel. Closed = moved off-screen with aria-hidden="true" (NOT display:none). */
  readonly menuPanel: Locator;
  readonly closeMenuButton: Locator;
  readonly allItemsLink: Locator;
  readonly logoutLink: Locator;
  readonly resetAppStateLink: Locator;

  constructor(private readonly page: Page) {
    this.cartLink = page.getByTestId('shopping-cart-link');
    this.cartBadge = page.getByTestId('shopping-cart-badge');
    this.menuButton = page.getByRole('button', { name: 'Open Menu' });
    this.menuPanel = page.locator('.bm-menu-wrap');
    this.closeMenuButton = page.getByRole('button', { name: 'Close Menu' });
    this.allItemsLink = page.getByTestId('inventory-sidebar-link');
    this.logoutLink = page.getByTestId('logout-sidebar-link');
    this.resetAppStateLink = page.getByTestId('reset-sidebar-link');
  }

  async openCart(): Promise<void> {
    await this.cartLink.click();
  }

  async expectCartCount(count: number): Promise<void> {
    if (count === 0) {
      await expect(this.cartBadge).toBeHidden();
    } else {
      await expect(this.cartBadge).toHaveText(String(count));
    }
  }

  /**
   * Opens the burger menu and waits until it is really open.
   * The closed menu is only slid off-screen, so "logout link is visible" is already true before opening;
   * the reliable signal is the panel's aria-hidden="false". The click is retried because right after a
   * page load the button can render before its click handler is attached (seen on Firefox).
   */
  private async openMenu(): Promise<void> {
    await expect(async () => {
      if ((await this.menuPanel.getAttribute('aria-hidden')) !== 'false') await this.menuButton.click();
      await expect(this.menuPanel).toHaveAttribute('aria-hidden', 'false', { timeout: 2_000 });
    }).toPass({ timeout: 8_000 });
  }

  /**
   * Opens the menu and clicks one of its items. If the item cannot be clicked (menu stuck half-open, which can
   * happen when the machine is busy or right after a reload on Firefox), the next attempt reloads the page and
   * opens the menu fresh. Reloading is safe: the cart lives in the browser's localStorage.
   */
  private async clickMenuItem(item: Locator): Promise<void> {
    let attempt = 0;
    await expect(async () => {
      if (attempt++ > 0) await this.page.reload();
      await this.openMenu();
      await expect(item).toBeInViewport({ timeout: 2_000 });
      await item.click({ timeout: 3_000 });
    }).toPass({ timeout: 45_000 });
  }

  async logout(): Promise<void> {
    await this.clickMenuItem(this.logoutLink);
  }

  async resetAppState(): Promise<void> {
    await this.clickMenuItem(this.resetAppStateLink);
    await this.closeMenuButton.click();
  }
}
