# GenAI Integration

This framework was built with an AI coding assistant (Claude Code). Each GenAI task from the assignment is listed below
with the prompt used, what it produced, and how the output was **verified**. No generated artifact was accepted
without being checked against the live application.

## 1. Generate locators for cart and checkout pages

**Prompt**
> Visit saucedemo.com, log in as standard_user, add two items, and walk through cart → checkout information →
> overview → complete. On each page, list every element with a `data-test` attribute and its text. Then generate
> Playwright page objects that use `getByTestId` with `testIdAttribute: 'data-test'`. Locate products by visible
> name, not by slug-based ids.

**Output:** `pages/CartPage.ts`, `pages/CheckoutInformationPage.ts`, `pages/CheckoutOverviewPage.ts`,
`pages/CheckoutCompletePage.ts`, `pages/components/CartItemList.ts`, `pages/components/HeaderComponent.ts`.

**Verification:** a DOM probe script dumped every `[data-test]` attribute from the live pages. Locators were written
against that dump, not guessed. The probe also found the **"Generate PDF order"** button (`data-test=generate-pdf-order`),
which became the basis of the PDF validation tests.

## 2. Create sample test data for login and product selection

**Prompt**
> Create JSON test data for SauceDemo: the accepted users; a table of invalid logins with the exact expected error
> message for each (empty fields, wrong or unknown credentials, case sensitivity, injection string, whitespace, locked
> user); the product catalog with prices; and product-selection scenarios with expected subtotal, tax (8%) and total.

**Output:** `test-data/users.json`, `test-data/products.json`, `test-data/checkout.json`, plus a typed loader in
`test-data/index.ts`.

**Verification:** every expected error message and every expected total was confirmed by running the tests against
the live site. The `two items` expected values exposed a real application defect (see README).

## 3. Write assertions for total price and confirmation

**Prompt**
> Write reusable Playwright assertions that check the checkout overview totals against an independently computed
> oracle (sum of line items, tax at TAX_RATE rounded to cents, total = subtotal + tax), check the internal
> consistency of the displayed values, and check the confirmation page and the downloaded PDF receipt.

**Output:** `assertions/checkout.assertions.ts` (`expectOrderTotals`, `expectOrderConfirmation`, `expectOrderPdf`),
`utils/price.utils.ts` (`parseMoney`, `roundCurrency`, `calculateOrderTotals`).

**Verification:** soft assertions name each check so a failure says exactly which rule broke. The assertions
caught the float-rendering bug (`$59.980000000000004`).

## 4. Generate report setup

**Prompt**
> Configure Playwright reporters: list/github console, HTML, JUnit and JSON, Allure with environment info, and blob
> in CI for shard merging. Capture screenshots for every test and trace and video on failure. Attach named step
> screenshots and downloaded PDFs.

**Output:** `reporter` and `use` sections in `playwright.config.ts`, the `snap` fixture in `fixtures/test.fixtures.ts`,
and the PDF attachment in `utils/pdf.utils.ts`.

## 5. Create CI workflow for execution

**Prompt**
> Create a GitHub Actions workflow that runs on push, PR, nightly and manual dispatch (environment and tag inputs),
> runs a browser × shard matrix in parallel, uploads per-job artifacts, and merges them into a single Playwright HTML
> report and a single Allure report.

**Output:** `.github/workflows/e2e.yml`.

## Issues found during AI-assisted development (and fixed by verification)

| Issue | How it was caught | Fix |
|---|---|---|
| Latest Playwright has no browsers for Ubuntu 20.04 | Browser install failed | Pinned Playwright to 1.49.1 and a compatible `allure-playwright` |
| Assumed the login inputs lose the `input_error` class after the error is dismissed | Test failure against the live site | Removed the incorrect assertion |
| PDF download and the confirmation image were slow under heavy parallel load | `--repeat-each=3` stress run | Used the navigation timeout for these waits |
| `pdf-parse` 1.x (bundles pdf.js 1.10) intermittently rejected valid receipts with "bad XRef entry" | Stress run; the same file parsed cleanly with a modern parser | Upgraded to `pdf-parse` 2.x |

## 6. Screenshot-to-PDF evidence (VS Code edition)

**Prompt**
> Add an automatic Playwright fixture that collects a screenshot at each test step, plus a final screenshot, and after
> every test writes numbered PNGs and a single A4 evidence PDF with pdf-lib. The PDF should have a cover page (test,
> browser, status including expected failures, duration, error), one captioned page per screenshot, and the
> downloaded order receipt appended. File names must be valid on Windows.

**Output:** `utils/evidence.utils.ts`, the `evidence` and `snap` fixtures in `fixtures/test.fixtures.ts`, and step
`snap()` calls in `tests/checkout.spec.ts` and `tests/order-pdf.spec.ts`.

**Verification:** the generated PDFs were parsed and rendered page by page. This confirmed the cover data, the step
order, the known-defect status text and that the appended receipt pages are present.
