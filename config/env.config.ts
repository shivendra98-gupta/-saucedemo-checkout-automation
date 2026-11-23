/**
 * FILE: config/env.config.ts
 *
 * WHAT: Loads the environment settings (URL, password, tax rate, timeouts, browser) for the test run.
 *
 * HOW : Picks env/.env.<TEST_ENV> (default qa), loads it with dotenv, validates required keys and exports a frozen
 * `envConfig` object. Variables already set in the terminal or CI win over the file.
 *
 * USED BY: playwright.config.ts, fixtures, assertions, CheckoutCompletePage.
 *
 * See PROJECT_GUIDE.txt for how all files fit together.
 */
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

/**
 * Loads environment configuration from env/.env.<TEST_ENV> (default: qa).
 * Values already exported in the shell (e.g. from CI secrets) take precedence.
 */
const testEnv = process.env.TEST_ENV ?? 'qa';
const envFile = path.resolve(__dirname, '..', 'env', `.env.${testEnv}`);

if (!fs.existsSync(envFile)) {
  throw new Error(`Environment file not found for TEST_ENV="${testEnv}": ${envFile}`);
}
dotenv.config({ path: envFile });

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

/** Browser projects defined in playwright.config.ts. */
export const BROWSERS = ['chrome', 'msedge', 'chromium', 'firefox', 'webkit'] as const;

export const envConfig = Object.freeze({
  name: testEnv,
  baseURL: required('BASE_URL'),
  defaultPassword: required('DEFAULT_PASSWORD'),
  taxRate: Number(process.env.TAX_RATE ?? '0.08'),
  defaultTimeout: Number(process.env.DEFAULT_TIMEOUT ?? '10000'),
  navigationTimeout: Number(process.env.NAVIGATION_TIMEOUT ?? '30000'),
  browser: browserSetting(),
});

export type BrowserName = (typeof BROWSERS)[number];

function browserSetting(): BrowserName | 'all' {
  const value = (process.env.BROWSER ?? 'chrome').trim().toLowerCase();
  if (value === 'all' || (BROWSERS as readonly string[]).includes(value)) return value as BrowserName | 'all';
  throw new Error(`BROWSER="${value}" is not supported. Use one of: ${BROWSERS.join(', ')}, all`);
}
