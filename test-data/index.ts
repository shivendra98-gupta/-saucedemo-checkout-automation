/**
 * FILE: test-data/index.ts
 *
 * WHAT: Typed access to the JSON test data files in this folder.
 *
 * HOW : Imports users.json, products.json and checkout.json, exports them as Users / Products / CheckoutData with
 * TypeScript types, and productByName(name), which throws on a typo so bad data fails fast.
 *
 * USED BY: Every spec, fixtures, assertions, CheckoutInformationPage (Customer type).
 *
 * See PROJECT_GUIDE.txt for how all files fit together.
 */
import users from './users.json';
import products from './products.json';
import checkout from './checkout.json';

export type Credentials = { username: string; password: string };
export type Product = (typeof products.catalog)[number];
export type ProductSelection = (typeof products.selections)[number];
export type Customer = { firstName: string; lastName: string; postalCode: string };

export const Users = users;
export const Products = products;
export const CheckoutData = checkout;

/** Look up a catalog product by its display name (fails fast on typos in test data). */
export function productByName(name: string): Product {
  const product = products.catalog.find((p) => p.name === name);
  if (!product) throw new Error(`Product "${name}" not found in test-data/products.json`);
  return product;
}
