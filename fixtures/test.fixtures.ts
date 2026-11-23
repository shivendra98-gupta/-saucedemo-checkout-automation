/**
 * FILE: fixtures/test.fixtures.ts
 *
 * WHAT: Shared test setup: ready-made page objects, login helpers, the snap() screenshot helper and the
 * automatic EVIDENCE collector.
 *
 * HOW : Extends Playwright's `test`. A test asks for what it needs as a parameter, e.g. ({ loggedIn, cartPage, snap }).
 * The `evidence` fixture runs for EVERY test (auto). It collects snap() screenshots, adds a final screenshot
 * (also attached to the report, passed or failed),
 * then writes reports/screenshots/<test>-<browser>/NN-step.png and reports/evidence/<test>-<browser>.pdf
 * and attaches the PDF to the HTML report. Evidence errors only print a warning; they never fail a test.
 *
 * USED BY: Every spec file (import { test, expect } from '../fixtures/test.fixtures').
 *
 * See PROJECT_GUIDE.txt for how all files fit together.
 */
import { test as base, expect } from '@playwright/test';
import {
  CartPage,
  CheckoutCompletePage,
  CheckoutInformationPage,
  CheckoutOverviewPage,
  InventoryPage,
  LoginPage,
  ProductDetailsPage,
} from '../pages';
import { envConfig } from '../config/env.config';
import { Users } from '../test-data';
import { buildEvidencePdf, saveScreenshots, type Evidence } from '../utils/evidence.utils';

type Pages = {
  loginPage: LoginPage;
  inventoryPage: InventoryPage;
  productDetailsPage: ProductDetailsPage;
  cartPage: CartPage;
  checkoutInformationPage: CheckoutInformationPage;
  checkoutOverviewPage: CheckoutOverviewPage;
  checkoutCompletePage: CheckoutCompletePage;
};

type Helpers = {
  /** Opens the login page and signs in; asserts the inventory page loads. */
  loginAs: (username?: string, password?: string) => Promise<void>;
  /** Logged in as standard_user and sitting on the inventory page. */
  loggedIn: InventoryPage;
  /** Takes a full-page screenshot: attached to the report, saved as PNG and added to the evidence PDF. */
  snap: (name: string) => Promise<void>;
  /**
   * Runs automatically for every test. Collects the snap() screenshots plus a final screenshot and, after the
   * test, writes reports/screenshots/<test>/NN-step.png and one evidence PDF per test in reports/evidence/.
   */
  evidence: Evidence;
};

export const test = base.extend<Pages & Helpers>({
  loginPage: async ({ page }, use) => use(new LoginPage(page)),
  inventoryPage: async ({ page }, use) => use(new InventoryPage(page)),
  productDetailsPage: async ({ page }, use) => use(new ProductDetailsPage(page)),
  cartPage: async ({ page }, use) => use(new CartPage(page)),
  checkoutInformationPage: async ({ page }, use) => use(new CheckoutInformationPage(page)),
  checkoutOverviewPage: async ({ page }, use) => use(new CheckoutOverviewPage(page)),
  checkoutCompletePage: async ({ page }, use) => use(new CheckoutCompletePage(page)),

  evidence: [
    async ({ page }, use, testInfo) => {
      const evidence: Evidence = { startedAt: new Date(), shots: [], documents: [] };
      await use(evidence);

      // ---- after the test ----
      try {
        if (!page.isClosed()) {
          const name = `final state (${testInfo.status})`;
          const png = await page.screenshot({ fullPage: true });
          evidence.shots.push({ name, png, takenAt: new Date() });
          // Shown as an image in the HTML/Allure report for EVERY test, passed or failed.
          await testInfo.attach(name, { body: png, contentType: 'image/png' });
        }
        saveScreenshots(evidence, testInfo);
        const pdfPath = await buildEvidencePdf(evidence, testInfo);
        await testInfo.attach('evidence.pdf', { path: pdfPath, contentType: 'application/pdf' });
      } catch (error) {
        // Evidence is best-effort: never turn a passing test red because a screenshot/PDF could not be written.
        console.warn(`[evidence] could not write evidence for "${testInfo.title}": ${(error as Error).message}`);
      }
    },
    { auto: true },
  ],

  snap: async ({ page, evidence }, use, testInfo) => {
    await use(async (name: string) => {
      const png = await page.screenshot({ fullPage: true });
      evidence.shots.push({ name, png, takenAt: new Date() });
      await testInfo.attach(name, { body: png, contentType: 'image/png' });
    });
  },

  loginAs: async ({ loginPage, inventoryPage }, use) => {
    await use(async (username = Users.standardUser.username, password = envConfig.defaultPassword) => {
      await test.step(`Login as ${username}`, async () => {
        await loginPage.open();
        await loginPage.login(username, password);
        await inventoryPage.expectLoaded();
      });
    });
  },

  loggedIn: async ({ loginAs, inventoryPage }, use) => {
    await loginAs();
    await use(inventoryPage);
  },
});

export { expect };
