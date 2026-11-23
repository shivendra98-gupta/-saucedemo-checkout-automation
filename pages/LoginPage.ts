/**
 * FILE: pages/LoginPage.ts
 *
 * WHAT: Page object for the login screen.
 *
 * HOW : Locators via data-test ids. login(user, pass), expectError(message) (also checks the red input styling),
 * dismissError(), expectOnLoginPage().
 *
 * USED BY: fixtures (loginAs), login.spec.ts.
 *
 * See PROJECT_GUIDE.txt for how all files fit together.
 */
import { expect, type Locator, type Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { Routes } from '../config/routes';

export class LoginPage extends BasePage {
  protected readonly path = Routes.login;

  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly errorMessage: Locator;
  readonly errorCloseButton: Locator;

  constructor(page: Page) {
    super(page);
    this.usernameInput = page.getByTestId('username');
    this.passwordInput = page.getByTestId('password');
    this.loginButton = page.getByTestId('login-button');
    this.errorMessage = page.getByTestId('error');
    this.errorCloseButton = page.getByTestId('error-button');
  }

  async login(username: string, password: string): Promise<void> {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }

  async expectError(message: string): Promise<void> {
    await expect(this.errorMessage).toBeVisible();
    await expect(this.errorMessage).toHaveText(message);
    await expect(this.usernameInput).toHaveClass(/input_error/);
    await expect(this.passwordInput).toHaveClass(/input_error/);
  }

  async dismissError(): Promise<void> {
    await this.errorCloseButton.click();
    await expect(this.errorMessage).toBeHidden();
  }

  async expectOnLoginPage(): Promise<void> {
    await expect(this.loginButton).toBeVisible();
    await expect(this.usernameInput).toBeVisible();
  }
}
