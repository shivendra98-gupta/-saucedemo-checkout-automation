/**
 * FILE: config/routes.ts
 *
 * WHAT: Single list of the application's URL paths.
 *
 * HOW : Plain constants (e.g. Routes.cart = '/cart.html'); combined with baseURL by page.goto().
 *
 * USED BY: Page objects (their `path`) and login.spec.ts (protected-route tests).
 *
 * See PROJECT_GUIDE.txt for how all files fit together.
 */
/** Application routes relative to baseURL. */
export const Routes = {
  login: '/',
  inventory: '/inventory.html',
  cart: '/cart.html',
  checkoutInformation: '/checkout-step-one.html',
  checkoutOverview: '/checkout-step-two.html',
  checkoutComplete: '/checkout-complete.html',
} as const;
