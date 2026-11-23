/**
 * FILE: tests/order-pdf.spec.ts
 *
 * WHAT: Order confirmation PDF tests (3).
 *
 * HOW : Places an order, clicks 'Generate PDF order', saves and parses the PDF, validates it with expectOrderPdf(),
 * and appends the receipt to the test's evidence PDF (after the step screenshots).
 *
 * USED BY: Run: npm run test:pdf
 *
 * See PROJECT_GUIDE.txt for how all files fit together.
 */
import { test, expect } from '../fixtures/test.fixtures';
import { CheckoutData, Products, productByName } from '../test-data';
import { envConfig } from '../config/env.config';
import { expectOrderConfirmation, expectOrderPdf, expectOrderTotals } from '../assertions/checkout.assertions';
import { isPdfBuffer, saveAndParsePdf } from '../utils/pdf.utils';

test.describe('Order confirmation PDF @pdf', () => {
  const scenarios = [
    { selection: Products.selections[0], customer: CheckoutData.validCustomers[0] },
    { selection: Products.selections[1], customer: CheckoutData.validCustomers[1] },
    { selection: Products.selections[4], customer: CheckoutData.validCustomers[0] },
  ];

  for (const { selection, customer } of scenarios) {
    test(`PDF receipt matches the order for ${selection.scenario}`, async ({
      loggedIn,
      cartPage,
      checkoutInformationPage,
      checkoutOverviewPage,
      checkoutCompletePage,
      snap,
      evidence,
    }, testInfo) => {
      if ('knownDefect' in selection) test.fail(true, `Known defect: ${selection.knownDefect}`);
      const items = selection.items.map(productByName);

      await loggedIn.addToCart(...items.map((i) => i.name));
      await loggedIn.header.openCart();
      await cartPage.checkout();
      await checkoutInformationPage.submit(customer);
      const totals = await expectOrderTotals(checkoutOverviewPage, items, envConfig.taxRate, selection.expected);
      await snap('1 - checkout overview with totals');
      await checkoutOverviewPage.finish();
      await expectOrderConfirmation(checkoutCompletePage);
      await snap('2 - order confirmation page');

      const pdf = await test.step('Download order PDF', async () => {
        const download = await checkoutCompletePage.downloadOrderPdf();
        const parsed = await saveAndParsePdf(download, testInfo);
        // Append the real receipt pages to this test's evidence PDF.
        evidence.documents.push({ name: 'Order confirmation PDF (downloaded from the app)', path: parsed.filePath });
        return parsed;
      });

      await test.step('Validate PDF contents', async () => {
        expect(isPdfBuffer(pdf.filePath), 'file has a %PDF- header').toBe(true);
        expectOrderPdf(pdf, { customer, items, totals });
      });
    });
  }
});
