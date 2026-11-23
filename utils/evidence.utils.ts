/**
 * FILE: utils/evidence.utils.ts
 *
 * WHAT: Writing evidence: step screenshots as PNG files and one evidence PDF per test.
 *
 * HOW : buildEvidencePdf() uses pdf-lib to create an A4 PDF: a cover page (test, browser, time, duration, status,
 * known-defect note, error), one captioned page per screenshot, then any attached documents (the downloaded
 * order receipt) copied in. saveScreenshots() writes numbered PNGs. safeName() makes Windows-safe file names.
 *
 * USED BY: fixtures/test.fixtures.ts (evidence fixture).
 *
 * See PROJECT_GUIDE.txt for how all files fit together.
 */
import fs from 'fs';
import path from 'path';
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from 'pdf-lib';
import type { TestInfo } from '@playwright/test';

/** One captured screenshot of the flow. */
export type EvidenceShot = { name: string; png: Buffer; takenAt: Date };

/** Everything collected for one test: screenshots in order, plus documents (e.g. the order receipt PDF). */
export type Evidence = {
  startedAt: Date;
  shots: EvidenceShot[];
  documents: { name: string; path: string }[];
};

export const EVIDENCE_DIR = path.resolve(__dirname, '..', 'reports', 'evidence');
export const SCREENSHOT_DIR = path.resolve(__dirname, '..', 'reports', 'screenshots');

const A4 = { width: 595.28, height: 841.89 };
const MARGIN = 36;

/** File/folder name that is valid on Windows, macOS and Linux. */
export function safeName(value: string, max = 100): string {
  return value
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, '_')
    .replace(/[^\w.\- ]+/g, '_')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^[_.]+|[_.]+$/g, '')
    .slice(0, max);
}

/** Built-in PDF fonts only support WinAnsi characters; replace anything else (e.g. arrows). */
function pdfText(value: string): string {
  return value
    .replace(/→/g, '->')
    .replace(/\r?\n/g, '\n')
    .replace(/[^\n\x20-\x7E\xA0-\xFF]/g, '?');
}

function testLabel(testInfo: TestInfo): string {
  return `${testInfo.titlePath.slice(1).join(' > ')} [${testInfo.project.name}]`;
}

/** Saves each screenshot as a numbered PNG under reports/screenshots/<test>/ (easy to browse in Explorer). */
export function saveScreenshots({ shots }: Evidence, testInfo: TestInfo): string {
  const dir = path.join(SCREENSHOT_DIR, safeName(`${testInfo.titlePath.slice(1).join('-')}-${testInfo.project.name}`));
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  shots.forEach((shot, i) => {
    fs.writeFileSync(path.join(dir, `${String(i + 1).padStart(2, '0')}-${safeName(shot.name, 60)}.png`), shot.png);
  });
  return dir;
}

/**
 * Builds a single "evidence" PDF for a test: a cover page (test, status, browser, time) followed by
 * one A4 page per screenshot, in the order they were taken, each with a caption.
 */
export async function buildEvidencePdf(evidence: Evidence, testInfo: TestInfo): Promise<string> {
  const { shots } = evidence;
  const pdf = await PDFDocument.create();
  pdf.setTitle(pdfText(`Test evidence - ${testInfo.title}`));
  pdf.setAuthor('SauceDemo checkout automation');
  pdf.setCreator('Playwright + pdf-lib');

  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  addCoverPage(pdf.addPage([A4.width, A4.height]), font, bold, evidence, testInfo);

  for (const [index, shot] of shots.entries()) {
    const page = pdf.addPage([A4.width, A4.height]);
    const caption = `Step ${index + 1} of ${shots.length}: ${shot.name}`;
    page.drawText(pdfText(caption), { x: MARGIN, y: A4.height - MARGIN - 14, size: 14, font: bold });
    page.drawText(pdfText(`${shot.takenAt.toLocaleString()}  |  ${testLabel(testInfo)}`), {
      x: MARGIN, y: A4.height - MARGIN - 30, size: 8, font, color: rgb(0.4, 0.4, 0.4), maxWidth: A4.width - 2 * MARGIN,
    });

    const image = await pdf.embedPng(shot.png);
    const boxWidth = A4.width - 2 * MARGIN;
    const boxHeight = A4.height - 2 * MARGIN - 50;
    const scale = Math.min(boxWidth / image.width, boxHeight / image.height, 1);
    const width = image.width * scale;
    const height = image.height * scale;
    const x = MARGIN + (boxWidth - width) / 2;
    const y = A4.height - MARGIN - 44 - height;
    page.drawRectangle({ x: x - 1, y: y - 1, width: width + 2, height: height + 2, borderColor: rgb(0.8, 0.8, 0.8), borderWidth: 1 });
    page.drawImage(image, { x, y, width, height });
  }

  // Append attached documents (e.g. the downloaded order receipt) after the screenshots.
  for (const doc of evidence.documents) {
    const divider = pdf.addPage([A4.width, A4.height]);
    divider.drawText('Attached document', { x: MARGIN, y: A4.height / 2 + 20, size: 20, font: bold });
    divider.drawText(pdfText(doc.name), { x: MARGIN, y: A4.height / 2 - 6, size: 12, font });
    divider.drawText(pdfText(path.basename(doc.path)), { x: MARGIN, y: A4.height / 2 - 24, size: 9, font, color: rgb(0.4, 0.4, 0.4) });
    const source = await PDFDocument.load(fs.readFileSync(doc.path));
    for (const copied of await pdf.copyPages(source, source.getPageIndices())) pdf.addPage(copied);
  }

  fs.mkdirSync(EVIDENCE_DIR, { recursive: true });
  const file = path.join(EVIDENCE_DIR, `${safeName(`${testInfo.titlePath.slice(1).join('-')}-${testInfo.project.name}`)}.pdf`);
  fs.writeFileSync(file, await pdf.save());
  return file;
}

function addCoverPage(page: PDFPage, font: PDFFont, bold: PDFFont, evidence: Evidence, testInfo: TestInfo): void {
  const { shots } = evidence;
  const durationMs = Date.now() - evidence.startedAt.getTime();
  const passed = testInfo.status === testInfo.expectedStatus;
  const statusText = testInfo.expectedStatus === 'failed' && passed
    ? 'PASSED (expected failure - known defect)'
    : passed ? 'PASSED' : (testInfo.status ?? 'unknown').toUpperCase();
  const statusColor = passed ? rgb(0.1, 0.55, 0.25) : rgb(0.8, 0.15, 0.15);

  let y = A4.height - 90;
  page.drawText('Test Execution Evidence', { x: MARGIN, y, size: 24, font: bold });
  y -= 22;
  page.drawText('SauceDemo checkout automation', { x: MARGIN, y, size: 12, font, color: rgb(0.4, 0.4, 0.4) });
  y -= 40;

  const rows: [string, string][] = [
    ['Test', testInfo.title],
    ['Suite', testInfo.titlePath.slice(1, -1).join(' > ') || '-'],
    ['Spec file', path.basename(testInfo.file)],
    ['Browser', testInfo.project.name],
    ['Started', evidence.startedAt.toLocaleString()],
    ['Duration', `${(durationMs / 1000).toFixed(1)} s`],
    ['Retry', String(testInfo.retry)],
    ['Screenshots', String(shots.length)],
    ['Documents', evidence.documents.map((d) => d.name).join(', ') || '-'],
  ];
  for (const [label, value] of rows) {
    page.drawText(`${label}:`, { x: MARGIN, y, size: 11, font: bold });
    page.drawText(pdfText(value), { x: MARGIN + 90, y, size: 11, font, maxWidth: A4.width - 2 * MARGIN - 90, lineHeight: 14 });
    y -= value.length > 70 ? 32 : 20;
  }

  y -= 10;
  page.drawText('Status:', { x: MARGIN, y, size: 14, font: bold });
  page.drawText(statusText, { x: MARGIN + 90, y, size: 14, font: bold, color: statusColor });

  if (testInfo.annotations.length) {
    y -= 30;
    for (const a of testInfo.annotations) {
      page.drawText(pdfText(`${a.type}: ${a.description ?? ''}`), {
        x: MARGIN, y, size: 10, font, color: rgb(0.45, 0.3, 0), maxWidth: A4.width - 2 * MARGIN, lineHeight: 13,
      });
      y -= 30;
    }
  }

  if (!passed && testInfo.error?.message) {
    y -= 30;
    page.drawText('Error:', { x: MARGIN, y, size: 11, font: bold, color: statusColor });
    // strip ANSI colour codes from Playwright error messages
    const message = testInfo.error.message
      .replace(/\u001b\[[0-9;]*m/g, '')
      .split('\n')
      .filter((line) => line.trim())
      .slice(0, 14)
      .join('\n')
      .slice(0, 1200);
    page.drawText(pdfText(message), {
      x: MARGIN, y: y - 16, size: 9, font, maxWidth: A4.width - 2 * MARGIN, lineHeight: 11,
    });
  }

  y = 80;
  page.drawText('Steps captured:', { x: MARGIN, y: y + 14 * Math.min(shots.length, 4), size: 10, font: bold });
  shots.slice(0, 4).forEach((s, i) => {
    page.drawText(pdfText(`${i + 1}. ${s.name}`), { x: MARGIN + 10, y: y + 14 * (Math.min(shots.length, 4) - 1 - i), size: 9, font });
  });
}
