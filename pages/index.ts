/**
 * FILE: pages/index.ts
 *
 * WHAT: Barrel file: re-exports every page object so code can `import { CartPage } from '../pages'`.
 *
 * HOW : Only export statements.
 *
 * USED BY: fixtures/test.fixtures.ts.
 *
 * See PROJECT_GUIDE.txt for how all files fit together.
 */
export * from './BasePage';
export * from './LoginPage';
export * from './InventoryPage';
export * from './ProductDetailsPage';
export * from './CartPage';
export * from './CheckoutInformationPage';
export * from './CheckoutOverviewPage';
export * from './CheckoutCompletePage';
export * from './components/HeaderComponent';
export * from './components/CartItemList';
