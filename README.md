# SauceDemo Checkout Automation (VS Code edition)

End-to-end test automation of the checkout flow on [saucedemo.com](https://www.saucedemo.com), built with
**Playwright + TypeScript** and the **Page Object Model**. It runs natively on **Windows** (no WSL needed), macOS
and Linux, from **VS Code** or a terminal.

Tests run on the **Google Chrome installed on your PC** by default. You can switch to Edge or Playwright's own
Chromium, Firefox or WebKit with one setting.

Every test produces **step screenshots** and **one evidence PDF**. The evidence PDF has a cover page (test, status,
browser, time), one page per screenshot, and, for the order-PDF tests, the downloaded order receipt appended at the end.

> For a description of every file in the project, see **[PROJECT_GUIDE.txt](PROJECT_GUIDE.txt)**. Each source file
> also starts with a short header comment (FILE / WHAT / HOW / USED BY).

---

## 1. What to install (Windows)

| # | Tool | Why | Where |
|---|---|---|---|
| 1 | **Node.js 22 LTS** (or 20.16+) | Runs Playwright and the tests | https://nodejs.org → "LTS" Windows Installer (.msi). Keep the default options |
| 2 | **VS Code** | Editor | https://code.visualstudio.com |
| 3 | **Playwright Test for VS Code** extension | ▶ buttons next to tests, Test Explorer, debugging | VS Code → Extensions (Ctrl+Shift+X) → search "Playwright Test for VSCode" (Microsoft). VS Code also suggests it when you open the folder |
| 4 | **Google Chrome** | The default test browser | https://www.google.com/chrome (Edge is already on Windows if you prefer it) |
| 5 | *Optional:* Java 11+ | Only for the Allure report | https://adoptium.net |
| 6 | *Optional:* Git | Push to GitHub | https://git-scm.com/download/win |

To check the install, open a **new** terminal and run `node -v` (should be v22.x or v20.16+) and `npm -v`.

## 2. First-time setup

1. Extract or clone the project, for example to `C:\Projects\saucedemo-checkout-automation-vscode`.
2. In VS Code, choose **File → Open Folder…** and select that folder. Click **Yes, I trust the authors** if asked, and
   **Install** if VS Code offers the recommended Playwright extension.
3. Open a terminal with **Terminal → New Terminal** (Ctrl+\`). PowerShell or Command Prompt both work. Then run:
   ```
   npm ci
   ```
   `npm ci` installs the libraries into `node_modules`. That's all you need to run on Google Chrome.
   Only if you want Playwright's own browsers: `npx playwright install chromium firefox webkit`.

> If PowerShell says *"running scripts is disabled on this system"*, either switch the terminal to **Command Prompt**
> (the ⌄ next to + in the terminal panel) or run once:
> `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`

## 3. Running the tests

### From the terminal
```
npm test                 # all 59 tests on Google Chrome (the BROWSER in env/.env.qa), in parallel, headless
npm run test:headed      # watch the browser, one test at a time
npm run test:ui          # Playwright UI mode: pick tests, time-travel through steps
npm run test:edge        # Microsoft Edge
npm run test:chromium    # Playwright's Chromium (needs: npx playwright install chromium)
npm run test:firefox     # Firefox (needs: npx playwright install firefox)
npm run test:all-browsers   # chromium + firefox + webkit
npm run test:smoke       # @smoke tests only
npm run test:negative    # @negative tests only
npm run test:pdf         # order-PDF tests only
npm run test:staging     # use env/.env.staging instead of env/.env.qa
npx playwright test tests/checkout.spec.ts       # one file
npx playwright test -g "entire catalog"          # tests whose name matches
```

### From VS Code (Playwright extension)
- Open the **Testing** view (beaker icon in the left bar). All tests appear in a tree. Click ▶ on a file, a group or a single test.
- Or open a spec file in `tests/` and click the green ▶ in the gutter beside any `test(...)`.
- At the bottom of the Testing view, the **Playwright** section shows the browser project (**chrome**) and has a
  **Show browser** checkbox for watching the run live.
- To debug, set a breakpoint, then right-click ▶ → **Debug Test**. Or use **Run and Debug** (Ctrl+Shift+D) → *Debug current spec file*.

### From VS Code tasks
**Terminal → Run Task…** → *Run all tests (browser from env/.env.qa)*, *Run all tests (Google Chrome)*, *Run all tests (Microsoft Edge)*, *Run PDF tests*, *Open HTML report*, …

### Changing the default browser
Open `env/.env.qa` and change `BROWSER=chrome` to `msedge`, `chromium`, `firefox` or `webkit`. That browser is then
used by `npm test`, the VS Code Testing view and the debug configurations. Playwright's own browsers must first be
downloaded with `npx playwright install <name>`.

## 4. Results: reports, screenshots, PDFs

| What | Where | How to open |
|---|---|---|
| **Evidence PDF per test** (cover + every step screenshot + order receipt) | `reports/evidence/<test>-<browser>.pdf` | Double-click in Explorer |
| **Step screenshots** (numbered PNGs per test) | `reports/screenshots/<test>-<browser>/01-….png` | Explorer or VS Code |
| **HTML report** (steps, screenshots, evidence PDF and receipt attached) | `reports/html-report/index.html` | `npm run report` |
| **Downloaded order receipts** | `test-results/<test>/swag-labs-order-*.pdf` | Double-click |
| Allure report | `reports/allure-results` | `npm run allure:generate` then `npm run allure:open` (needs Java) |
| JUnit XML / JSON | `reports/junit/results.xml`, `reports/json/results.json` | For CI tools |
| Trace + video (failed tests only) | `test-results/<test>/` | `npx playwright show-trace <trace.zip>` |

### What is captured for each test

| | Passed test | Failed test |
|---|---|---|
| Step screenshots (`snap()` in checkout and PDF tests) | ✅ report + PNG + evidence PDF | ✅ report + PNG + evidence PDF |
| Final screenshot | ✅ report + PNG + evidence PDF | ✅ report + PNG + evidence PDF (state at the moment of failure) |
| Evidence PDF | ✅ green PASSED cover | ✅ red FAILED cover **with the error message** |
| Playwright failure screenshot, video, trace | - | ✅ in the HTML report and `test-results/` |

`npm run clean` deletes all previous results.

Samples from a real run are in `docs/`: `sample-evidence-checkout-flow.pdf`, `sample-evidence-pdf-flow.pdf`,
`sample-order-confirmation.pdf` and `screenshots/`.

## 5. Configuration

`env/.env.qa` is used by default. Set `TEST_ENV=staging` (or use `npm run test:staging`) to use `env/.env.staging`.

| Variable | Meaning | Default |
|---|---|---|
| `BASE_URL` | Application under test | `https://www.saucedemo.com` |
| `DEFAULT_PASSWORD` | Password of the demo users | `secret_sauce` |
| `TAX_RATE` | Tax rate used to calculate the expected totals | `0.08` |
| `DEFAULT_TIMEOUT` | Action/assertion timeout (ms) | `10000` |
| `NAVIGATION_TIMEOUT` | Page load, PDF generation and slow-image timeout (ms) | `30000` |
| `BROWSER` | `chrome`, `msedge`, `chromium`, `firefox`, `webkit` or `all` | `chrome` |

Browsers, parallel workers, retries and reporters are configured in `playwright.config.ts`.

## 6. What is tested (59 tests)

| Spec | What it covers |
|---|---|
| `login.spec.ts` (24) | ✅ 5 accepted users, Enter-key login, masked password, logout. ❌ 10 invalid credential cases (empty fields, wrong or unknown user, case sensitivity, SQL-injection string, whitespace, locked-out user), dismissing the error, 5 protected pages blocked without login |
| `cart.spec.ts` (14) | Catalog names and prices; add/remove from the inventory, cart and details pages; badge count; cart survives reload and re-login; continue shopping; reset app state; 4 sort orders |
| `checkout.spec.ts` (18) | ✅ Full checkout for 5 product selections, with totals and confirmation checked and 6 step screenshots each; 3 valid customer variants; `performance_glitch_user`. ❌ Each missing field, dismiss and resubmit, cancel on both steps. 🐞 3 known defects |
| `order-pdf.spec.ts` (3) | Downloads the **Generate PDF order** receipt and checks its file name, page count, customer, items, prices, item total, tax, total and message against the order placed |

**Totals check:** the expected item total, tax and total are calculated independently from the line items and compared
with the page, with the test data, and with each other (item total + tax = total). The label text must show exactly two decimals.

**Known defects:** tests marked `test.fail()` document real bugs. They pass while the bug exists and are flagged once it's fixed:
- the Bike Light + Fleece Jacket order shows `Item total: $59.980000000000004`;
- `problem_user` cannot type a last name;
- `error_user` cannot finish the order.

## 7. Troubleshooting

| Problem | Fix |
|---|---|
| `npx` / `npm` "is not recognized" | Node.js isn't on PATH. Reinstall Node.js, then **restart VS Code** |
| PowerShell: "running scripts is disabled" | Use a Command Prompt terminal, or `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` |
| `Chromium distribution 'chrome' is not found` | Google Chrome isn't installed in the standard location. Install it from google.com/chrome, or set `BROWSER=msedge` (or `chromium` after `npx playwright install chromium`) in `env/.env.qa` |
| `Executable doesn't exist … chromium/firefox/webkit` | Run `npx playwright install <that browser>` |
| VS Code Testing view shows no tests or "no projects" | Check `BROWSER` in `env/.env.qa` is one of the names above, then click ⟳ in the Testing view |
| Tests don't appear in the VS Code Testing view | Install the Playwright extension, run `npm ci`, then click ⟳ in the Testing view |
| Downloads fail on an office network | Set `HTTPS_PROXY` in Windows environment variables, then restart VS Code |
| A few tests time out | saucedemo.com is a public site and is sometimes slow. Run again, or use `npx playwright test --retries=1` |

## 8. CI

`.github/workflows/e2e.yml` runs on push, pull request, nightly and on demand. It runs Chromium, Firefox and WebKit on
Linux (2 shards each) plus Chromium on **Windows**, merges the HTML and Allure reports, and uploads the evidence PDFs
and screenshots as build artifacts.
