/**
 * FILE: tests/checkout.spec.ts
 *
 * WHAT: Checkout tests (18): full end-to-end orders, negative validations and documented known defects.
 *
 * HOW : End-to-end per products.json selection: login -> add items -> cart -> customer info -> overview totals ->
 * finish -> confirmation -> back home, with snap() screenshots at each step (they go into the evidence PDF).
 * Negative: each missing field, dismiss + resubmit, cancel on both steps. Known defects use test.fail():
 * they pass while the bug exists and are flagged once it is fixed.
 *
 * USED BY: Run: npx playwright test tests/checkout.spec.ts
 *
 * See PROJECT_GUIDE.txt for how all files fit together.
 */
import { test, expect } from '../fixtures/test.fixtures';
import { CheckoutData, Products, productByName } from '../test-data';
import { envConfig } from '../config/env.config';
import { expectOrderConfirmation, expectOrderTotals } from '../assertions/checkout.assertions';

const [defaultCustomer] = CheckoutData.validCustomers;

test.describe('Checkout - end to end', () => {
  for (const selection of Products.selections) {
    test(`completes order for ${selection.scenario} and validates totals @smoke`, async ({
      loggedIn,
      cartPage,
      checkoutInformationPage,
      checkoutOverviewPage,
      checkoutCompletePage,
      snap,
    }) => {
      if ('knownDefect' in selection) test.fail(true, `Known defect: ${selection.knownDefect}`);
      const items = selection.items.map(productByName);

      await test.step('Add items to cart', async () => {
        await snap('1 - logged in, products page');
        await loggedIn.addToCart(...items.map((i) => i.name));
        await loggedIn.header.expectCartCount(items.length);
        await snap('2 - items added to cart');
      });

      await test.step('Verify cart and proceed to checkout', async () => {
        await loggedIn.header.openCart();
        await cartPage.expectLoaded();
        await cartPage.cartItems.expectItems(items);
        await snap('3 - cart contents');
        await cartPage.checkout();
      });

      await test.step('Fill in customer information', async () => {
        await checkoutInformationPage.expectLoaded();
        await checkoutInformationPage.fillCustomerInformation(defaultCustomer);
        await snap('4 - customer information filled');
        await checkoutInformationPage.continueButton.click();
      });

      await test.step('Validate overview totals', async () => {
        await checkoutOverviewPage.expectLoaded();
        await expectOrderTotals(checkoutOverviewPage, items, envConfig.taxRate, selection.expected);
        await snap('5 - checkout overview with totals');
      });

      await test.step('Finish order and validate confirmation', async () => {
        await checkoutOverviewPage.finish();
        await expectOrderConfirmation(checkoutCompletePage);
        await snap('6 - order confirmation');
      });

      await test.step('Back home resets the cart', async () => {
        await checkoutCompletePage.backHome();
        await loggedIn.expectLoaded();
        await loggedIn.header.expectCartCount(0);
        await expect(loggedIn.addToCartButton(items[0].name)).toBeVisible();
      });
    });
  }

  for (const customer of CheckoutData.validCustomers) {
    test(`accepts customer information: ${customer.case}`, async ({
      loggedIn,
      cartPage,
      checkoutInformationPage,
      checkoutOverviewPage,
    }) => {
      await loggedIn.addToCart('Sauce Labs Onesie');
      await loggedIn.header.openCart();
      await cartPage.checkout();
      await checkoutInformationPage.submit(customer);
      await checkoutOverviewPage.expectLoaded();
    });
  }

  test('performance_glitch_user can still complete checkout', async ({
    loginAs,
    inventoryPage,
    cartPage,
    checkoutInformationPage,
    checkoutOverviewPage,
    checkoutCompletePage,
  }) => {
    test.slow();
    const item = productByName('Sauce Labs Bolt T-Shirt');
    await loginAs('performance_glitch_user');
    await inventoryPage.addToCart(item.name);
    await inventoryPage.header.openCart();
    await cartPage.checkout();
    await checkoutInformationPage.submit(defaultCustomer);
    await expectOrderTotals(checkoutOverviewPage, [item], envConfig.taxRate);
    await checkoutOverviewPage.finish();
    await expectOrderConfirmation(checkoutCompletePage);
  });
});

test.describe('Checkout - negative & navigation', () => {
  test.beforeEach(async ({ loggedIn, cartPage, checkoutInformationPage }) => {
    await loggedIn.addToCart('Sauce Labs Backpack');
    await loggedIn.header.openCart();
    await cartPage.checkout();
    await checkoutInformationPage.expectLoaded();
  });

  for (const data of CheckoutData.invalidCustomers) {
    test(`shows validation error when ${data.case} @negative`, async ({ checkoutInformationPage, page }) => {
      await checkoutInformationPage.submit(data);
      await checkoutInformationPage.expectError(data.expectedError);
      await checkoutInformationPage.expectLoaded();
      await expect(page).not.toHaveURL(/checkout-step-two/);
    });
  }

  test('validation error can be dismissed and form resubmitted @negative', async ({
    checkoutInformationPage,
    checkoutOverviewPage,
  }) => {
    await checkoutInformationPage.submit({ ...defaultCustomer, postalCode: '' });
    await checkoutInformationPage.expectError('Error: Postal Code is required');
    await checkoutInformationPage.dismissError();
    await checkoutInformationPage.postalCodeInput.fill(defaultCustomer.postalCode);
    await checkoutInformationPage.continueButton.click();
    await checkoutOverviewPage.expectLoaded();
  });

  test('cancel on information step returns to cart with items intact', async ({
    checkoutInformationPage,
    cartPage,
  }) => {
    await checkoutInformationPage.cancel();
    await cartPage.expectLoaded();
    await cartPage.cartItems.expectItems([productByName('Sauce Labs Backpack')]);
  });

  test('cancel on overview step returns to inventory without placing the order', async ({
    checkoutInformationPage,
    checkoutOverviewPage,
    inventoryPage,
  }) => {
    await checkoutInformationPage.submit(defaultCustomer);
    await checkoutOverviewPage.cancel();
    await inventoryPage.expectLoaded();
    await inventoryPage.header.expectCartCount(1);
  });
});

test.describe('Checkout - known application defects', () => {
  // These users are intentionally broken on SauceDemo. The tests document the defect:
  // they are expected to fail, and will flag (as "unexpectedly passed") once the bug is fixed.

  test('problem_user cannot enter a last name @negative', async ({ loginAs, inventoryPage, cartPage, checkoutInformationPage }) => {
    test.fail(true, 'Known defect: typing into Last Name overwrites First Name for problem_user');
    await loginAs('problem_user');
    await inventoryPage.addToCart('Sauce Labs Backpack');
    await inventoryPage.header.openCart();
    await cartPage.checkout();
    await checkoutInformationPage.fillCustomerInformation(defaultCustomer);
    await expect(checkoutInformationPage.lastNameInput).toHaveValue(defaultCustomer.lastName, { timeout: 3000 });
  });

  test('error_user cannot finish the order @negative', async ({
    loginAs,
    inventoryPage,
    cartPage,
    checkoutInformationPage,
    checkoutOverviewPage,
    checkoutCompletePage,
  }) => {
    test.fail(true, 'Known defect: Finish button does nothing for error_user');
    await loginAs('error_user');
    await inventoryPage.addToCart('Sauce Labs Backpack');
    await inventoryPage.header.openCart();
    await cartPage.checkout();
    await checkoutInformationPage.submit(defaultCustomer);
    await checkoutOverviewPage.finish();
    await expect(checkoutCompletePage.completeHeader).toBeVisible({ timeout: 3000 });
  });
});
