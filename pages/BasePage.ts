/**
 * FILE: pages/BasePage.ts
 *
 * WHAT: Parent class of every page object.
 *
 * HOW : Holds the Playwright `page`, the shared HeaderComponent and the page title locator. Subclasses set `path`;
 * open() navigates there and expectLoaded() asserts the URL (and optionally the title).
 *
 * USED BY: All classes in pages/.
 *
 * See PROJECT_GUIDE.txt for how all files fit together.
 */
import { expect, type Locator, type Page } from '@playwright/test';
import { HeaderComponent } from './components/HeaderComponent';

/** Common behaviour shared by every page object. */
export abstract class BasePage {
  readonly header: HeaderComponent;
  readonly title: Locator;

  /** Route of the page relative to baseURL. */
  protected abstract readonly path: string;

  constructor(protected readonly page: Page) {
    this.header = new HeaderComponent(page);
    this.title = page.getByTestId('title');
  }

  async open(): Promise<void> {
    await this.page.goto(this.path);
  }

  async expectLoaded(expectedTitle?: string): Promise<void> {
    await expect(this.page).toHaveURL(new RegExp(`${escapeRegExp(this.path)}$`));
    if (expectedTitle) await expect(this.title).toHaveText(expectedTitle);
  }
}

export function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
