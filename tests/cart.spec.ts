/**
 * FILE: tests/cart.spec.ts
 *
 * WHAT: Product selection and cart tests (14).
 *
 * HOW : Catalog names/prices, add/remove from the products page, the cart page and the details page, badge count,
 * cart survives reload and re-login, continue shopping, reset app state, and the 4 sort orders.
 *
 * USED BY: Run: npx playwright test tests/cart.spec.ts
 *
 * See PROJECT_GUIDE.txt for how all files fit together.
 */
import { test, expect } from '../fixtures/test.fixtures';
import { Products, productByName } from '../test-data';

const backpack = productByName('Sauce Labs Backpack');
const bikeLight = productByName('Sauce Labs Bike Light');
const jacket = productByName('Sauce Labs Fleece Jacket');

test.describe('Product selection & cart', () => {
  test('catalog shows the expected products and prices @smoke', async ({ loggedIn }) => {
    for (const product of Products.catalog) {
      await expect(loggedIn.productCard(product.name)).toBeVisible();
      expect(await loggedIn.productPrice(product.name)).toBe(product.price);
    }
  });

  test('adding one item updates badge and button state @smoke', async ({ loggedIn }) => {
    await loggedIn.header.expectCartCount(0);
    await loggedIn.addToCart(backpack.name);
    await loggedIn.header.expectCartCount(1);
    await expect(loggedIn.removeButton(backpack.name)).toBeVisible();
  });

  test('cart lists every added item with name, price and quantity', async ({ loggedIn, cartPage }) => {
    const items = [backpack, bikeLight, jacket];
    await loggedIn.addToCart(...items.map((i) => i.name));
    await loggedIn.header.expectCartCount(3);

    await loggedIn.header.openCart();
    await cartPage.expectLoaded();
    await cartPage.cartItems.expectItems(items);
  });

  test('removing an item from the inventory page decrements the badge', async ({ loggedIn }) => {
    await loggedIn.addToCart(backpack.name, bikeLight.name);
    await loggedIn.removeFromCart(backpack.name);
    await loggedIn.header.expectCartCount(1);
  });

  test('removing an item from the cart page updates the cart', async ({ loggedIn, cartPage }) => {
    await loggedIn.addToCart(backpack.name, jacket.name);
    await loggedIn.header.openCart();
    await cartPage.removeItem(backpack.name);
    await cartPage.cartItems.expectItems([jacket]);
    await cartPage.header.expectCartCount(1);
  });

  test('removing all items leaves an empty cart', async ({ loggedIn, cartPage }) => {
    await loggedIn.addToCart(backpack.name);
    await loggedIn.header.openCart();
    await cartPage.removeItem(backpack.name);
    await expect(cartPage.cartItems.items).toHaveCount(0);
    await cartPage.header.expectCartCount(0);
  });

  test('item can be added from the product details page', async ({ loggedIn, productDetailsPage, cartPage }) => {
    await loggedIn.openProductDetails(jacket.name);
    await productDetailsPage.expectProduct(jacket.name, jacket.price);
    await productDetailsPage.addToCart();
    await productDetailsPage.header.expectCartCount(1);

    await productDetailsPage.backToProducts();
    await expect(loggedIn.removeButton(jacket.name)).toBeVisible();
    await loggedIn.header.openCart();
    await cartPage.cartItems.expectItems([jacket]);
  });

  test('continue shopping keeps the cart contents', async ({ loggedIn, cartPage }) => {
    await loggedIn.addToCart(bikeLight.name);
    await loggedIn.header.openCart();
    await cartPage.continueShopping();
    await loggedIn.expectLoaded();
    await loggedIn.addToCart(backpack.name);
    await loggedIn.header.expectCartCount(2);
  });

  test('cart persists after page reload and re-login', async ({ loggedIn, loginAs, page }) => {
    await loggedIn.addToCart(backpack.name, bikeLight.name);
    await page.reload();
    await loggedIn.header.expectCartCount(2);

    await loggedIn.header.logout();
    await loginAs();
    await loggedIn.header.expectCartCount(2);
  });

  test('reset app state empties the cart', async ({ loggedIn, cartPage }) => {
    await loggedIn.addToCart(backpack.name, jacket.name);
    await loggedIn.header.resetAppState();
    await loggedIn.header.expectCartCount(0);
    await loggedIn.header.openCart();
    await expect(cartPage.cartItems.items).toHaveCount(0);
  });

  test.describe('sorting supports product selection', () => {
    const cases = [
      { option: 'az', describe: 'name A→Z', key: 'name', dir: 1 },
      { option: 'za', describe: 'name Z→A', key: 'name', dir: -1 },
      { option: 'lohi', describe: 'price low→high', key: 'price', dir: 1 },
      { option: 'hilo', describe: 'price high→low', key: 'price', dir: -1 },
    ] as const;

    for (const c of cases) {
      test(`sorts by ${c.describe}`, async ({ loggedIn }) => {
        await loggedIn.sortBy(c.option);
        if (c.key === 'name') {
          const names = await loggedIn.allNames();
          expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b) * c.dir));
        } else {
          const prices = await loggedIn.allPrices();
          expect(prices).toEqual([...prices].sort((a, b) => (a - b) * c.dir));
        }
      });
    }
  });
});
