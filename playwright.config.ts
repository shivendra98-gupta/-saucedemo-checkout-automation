/**
 * FILE: playwright.config.ts
 *
 * WHAT: Central Playwright configuration: where tests live, parallelism, retries, timeouts, reporters and browsers.
 *
 * HOW : Reads env/.env.<TEST_ENV> through config/env.config.ts. Defines five browser projects (chrome, msedge, chromium, firefox,
 * webkit) but enables only the one named by BROWSER (default: chrome = your installed Google Chrome).
 * Reporters: console, HTML (reports/html-report), JUnit, JSON, Allure, plus blob on CI.
 *
 * USED BY: Playwright test runner (npm test, VS Code Testing view, CI).
 *
 * See PROJECT_GUIDE.txt for how all files fit together.
 */
import { defineConfig, devices, type Project, type ReporterDescription } from '@playwright/test';
import { envConfig } from './config/env.config';

const isCI = !!process.env.CI;

const reporters: ReporterDescription[] = [
  [isCI ? 'github' : 'list'],
  ['html', { outputFolder: 'reports/html-report', open: 'never' }],
  ['junit', { outputFile: 'reports/junit/results.xml' }],
  ['json', { outputFile: 'reports/json/results.json' }],
  [
    'allure-playwright',
    {
      resultsDir: 'reports/allure-results',
      detail: true,
      suiteTitle: true,
      environmentInfo: { environment: envConfig.name, baseURL: envConfig.baseURL, browser: envConfig.browser, node: process.version, os: process.platform },
    },
  ],
];
// Sharded CI jobs emit blob reports that are merged into one HTML report afterwards.
if (isCI) reporters.push(['blob', { outputDir: 'blob-report' }]);

const viewport = { width: 1280, height: 800 };

const allProjects: Project[] = [
  // Browsers already installed on your machine
  { name: 'chrome', use: { ...devices['Desktop Chrome'], channel: 'chrome', viewport } },
  { name: 'msedge', use: { ...devices['Desktop Edge'], channel: 'msedge', viewport } },
  // Playwright's bundled browsers (downloaded by `npx playwright install <name>`)
  { name: 'chromium', use: { ...devices['Desktop Chrome'], viewport } },
  { name: 'firefox', use: { ...devices['Desktop Firefox'], viewport } },
  { name: 'webkit', use: { ...devices['Desktop Safari'], viewport } },
];

export default defineConfig({
  testDir: './tests',
  outputDir: 'test-results',
  fullyParallel: true,
  workers: process.env.WORKERS ? Number(process.env.WORKERS) : isCI ? 4 : '50%',
  retries: isCI ? 2 : 0,
  forbidOnly: isCI,
  timeout: 60_000,
  expect: { timeout: envConfig.defaultTimeout },
  reporter: reporters,

  use: {
    baseURL: envConfig.baseURL,
    testIdAttribute: 'data-test',
    actionTimeout: envConfig.defaultTimeout,
    navigationTimeout: envConfig.navigationTimeout,
    acceptDownloads: true,
    viewport,
    // Step screenshots + evidence PDFs are produced by the `evidence` fixture for EVERY test;
    // Playwright's own screenshot/trace/video are kept only when a test fails, to help debugging.
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
  },

  // Only the browser selected by BROWSER (env/.env.qa, default "chrome") is enabled, so `npm test` and the
  // VS Code Testing view run on that browser. BROWSER=all enables every project.
  projects: envConfig.browser === 'all' ? allProjects : allProjects.filter((p) => p.name === envConfig.browser),
});
