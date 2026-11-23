/**
 * FILE: tests/login.spec.ts
 *
 * WHAT: Login tests (24): positive and negative.
 *
 * HOW : Positive: each of the 5 accepted users logs in (session cookie checked), Enter key, masked password, logout.
 * Negative: every row of users.json -> invalidLogins (exact error text), dismissing the error, and 5 protected
 * pages that must redirect to login. Data-driven: add a case in users.json and it becomes a new test.
 *
 * USED BY: Run: npm test, npx playwright test tests/login.spec.ts, or the VS Code Testing view.
 *
 * See PROJECT_GUIDE.txt for how all files fit together.
 */
import { test, expect } from '../fixtures/test.fixtures';
import { Users } from '../test-data';
import { envConfig } from '../config/env.config';
import { Routes } from '../config/routes';

test.describe('Login', () => {
  test.beforeEach(async ({ loginPage }) => {
    await loginPage.open();
  });

  test.describe('positive', () => {
    for (const user of Users.acceptedUsers) {
      test(`${user.username} can log in @smoke`, async ({ loginPage, inventoryPage, page }) => {
        await loginPage.login(user.username, envConfig.defaultPassword);
        await inventoryPage.expectLoaded();
        await expect(inventoryPage.inventoryItems).toHaveCount(6);
        const cookies = await page.context().cookies();
        expect(cookies.find((c) => c.name === 'session-username')?.value).toBe(user.username);
      });
    }

    test('login can be submitted with the Enter key', async ({ loginPage, inventoryPage }) => {
      await loginPage.usernameInput.fill(Users.standardUser.username);
      await loginPage.passwordInput.fill(envConfig.defaultPassword);
      await loginPage.passwordInput.press('Enter');
      await inventoryPage.expectLoaded();
    });

    test('password field masks input', async ({ loginPage }) => {
      await expect(loginPage.passwordInput).toHaveAttribute('type', 'password');
    });

    test('user can log out and session is cleared', async ({ loginPage, inventoryPage, page }) => {
      await loginPage.login(Users.standardUser.username, envConfig.defaultPassword);
      await inventoryPage.expectLoaded();
      await inventoryPage.header.logout();
      await loginPage.expectOnLoginPage();

      await page.goto(Routes.inventory);
      await loginPage.expectError(Users.messages.loginRequiredForInventory);
    });
  });

  test.describe('negative', () => {
    for (const data of Users.invalidLogins) {
      test(`rejects login with ${data.case} @negative`, async ({ loginPage, page }) => {
        await loginPage.login(data.username, data.password);
        await loginPage.expectError(data.expectedError);
        await expect(page).not.toHaveURL(new RegExp(Routes.inventory));
      });
    }

    test('error message can be dismissed @negative', async ({ loginPage }) => {
      await loginPage.login('', '');
      await loginPage.expectError('Epic sadface: Username is required');
      await loginPage.dismissError();
    });

    const protectedRoutes = [Routes.inventory, Routes.cart, Routes.checkoutInformation, Routes.checkoutOverview, Routes.checkoutComplete];
    for (const route of protectedRoutes) {
      test(`blocks direct access to ${route} without login @negative`, async ({ page, loginPage }) => {
        await page.goto(route);
        await loginPage.expectOnLoginPage();
        await expect(loginPage.errorMessage).toHaveText(
          `Epic sadface: You can only access '${route}' when you are logged in.`,
        );
      });
    }
  });
});
