/**
 * FILE: utils/pdf.utils.ts
 *
 * WHAT: Reading PDFs: saves the downloaded order receipt and extracts its text and metadata.
 *
 * HOW : saveAndParsePdf() saves a Playwright Download into the test's output folder, attaches it to the report and
 * parses it with pdf-parse. compact() removes whitespace so the receipt's letter-spaced headings
 * ('O R D E R  D E T A I L S') can be compared. isPdfBuffer() checks the '%PDF-' header.
 *
 * USED BY: order-pdf.spec.ts, checkout.assertions.ts.
 *
 * See PROJECT_GUIDE.txt for how all files fit together.
 */
import fs from 'fs';
import path from 'path';
import type { Download, TestInfo } from '@playwright/test';
import { PDFParse } from 'pdf-parse';

export type ParsedPdf = {
  filePath: string;
  fileName: string;
  sizeBytes: number;
  numPages: number;
  info: Record<string, unknown>;
  text: string;
  /** Non-empty, trimmed text lines. */
  lines: string[];
};

/** Saves a Playwright download into the test's output dir, attaches it to the report and parses it. */
export async function saveAndParsePdf(download: Download, testInfo: TestInfo): Promise<ParsedPdf> {
  const fileName = download.suggestedFilename();
  const filePath = testInfo.outputPath(fileName);
  await download.saveAs(filePath);
  await testInfo.attach(fileName, { path: filePath, contentType: 'application/pdf' });
  return parsePdfFile(filePath);
}

export async function parsePdfFile(filePath: string): Promise<ParsedPdf> {
  const buffer = fs.readFileSync(filePath);
  // pdf-parse v2 wraps a current pdf.js; v1 bundled pdf.js 1.10, which intermittently
  // rejected valid react-pdf output with "bad XRef entry".
  const parser = new PDFParse({ data: buffer });
  try {
    const textResult = await parser.getText();
    const infoResult = await parser.getInfo();
    const text = textResult.text.replace(/^-- \d+ of \d+ --$/gm, ''); // drop page-separator markers
    return {
      filePath,
      fileName: path.basename(filePath),
      sizeBytes: buffer.length,
      numPages: textResult.total,
      info: (infoResult.info ?? {}) as Record<string, unknown>,
      text,
      lines: text
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean),
    };
  } finally {
    await parser.destroy();
  }
}

/** react-pdf renders letter-spaced headings ("O R D E R   D E TA I L S"); compare without whitespace. */
export function compact(text: string): string {
  return text.replace(/\s+/g, '').toLowerCase();
}

export function isPdfBuffer(filePath: string): boolean {
  return fs.readFileSync(filePath).subarray(0, 5).toString('latin1') === '%PDF-';
}
