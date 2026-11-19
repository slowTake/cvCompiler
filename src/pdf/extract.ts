/**
 * pdf.js document → PdfContent. Engine-agnostic: the browser passes the
 * regular pdf.js build, Node tests the legacy one.
 */
import type { PDFDocumentProxy } from 'pdfjs-dist';
import type { PdfContent, PdfLink, PdfPage, PdfTextItem } from './content';

/** The subset of pdf.js's OPS table this module needs. */
export interface PdfOps {
  setFillRGBColor: number;
  showText: number;
  showSpacedText: number;
  nextLineShowText: number;
  nextLineSetSpacingShowText: number;
}

interface Glyph {
  unicode?: string;
}

/**
 * Fill colour of each non-space character drawn, in drawing order. pdf.js
 * reports every fill colour as setFillRGBColor with a #rrggbb argument.
 */
function colorRuns(fnArray: number[], argsArray: unknown[][], ops: PdfOps): { chars: string; colors: string[] } {
  let fill = '#000000';
  let chars = '';
  const colors: string[] = [];
  const addGlyphs = (glyphs: unknown) => {
    if (!Array.isArray(glyphs)) return;
    for (const g of glyphs) {
      const text = (g as Glyph | null)?.unicode;
      if (typeof text !== 'string') continue;
      for (const ch of text) {
        if (/\s/.test(ch)) continue;
        chars += ch;
        colors.push(fill);
      }
    }
  };
  for (let i = 0; i < fnArray.length; i++) {
    const fn = fnArray[i];
    const args = argsArray[i] ?? [];
    if (fn === ops.setFillRGBColor && typeof args[0] === 'string') fill = args[0];
    else if (fn === ops.showText || fn === ops.showSpacedText || fn === ops.nextLineShowText) addGlyphs(args[0]);
    else if (fn === ops.nextLineSetSpacingShowText) addGlyphs(args[2]);
  }
  return { chars, colors };
}

/** Gives each text item the colour of its first character, matching characters in order. */
function assignColors(items: PdfTextItem[], runs: { chars: string; colors: string[] }): void {
  let pos = 0;
  for (const item of items) {
    const text = item.str.replace(/\s+/g, '');
    if (!text) continue;
    let at = runs.chars.startsWith(text, pos) ? pos : runs.chars.indexOf(text, pos);
    // Out-of-order drawing: look from the start rather than give up.
    if (at < 0) at = runs.chars.indexOf(text);
    if (at < 0) continue;
    item.color = runs.colors[at];
    pos = at + text.length;
  }
}

async function readPage(pdf: PDFDocumentProxy, n: number, ops: PdfOps): Promise<PdfPage> {
  const page = await pdf.getPage(n);
  const [x0, , , y1] = page.view;
  const width = page.view[2] - page.view[0];
  const height = page.view[3] - page.view[1];

  const text = await page.getTextContent();
  const items: PdfTextItem[] = [];
  for (const raw of text.items) {
    if (!('str' in raw)) continue;
    // Firefox writes NUL where a glyph has no Unicode mapping (its "+" and "–", for one).
    const str = raw.str.replace(/[\p{Cc}\ufffd]/gu, '');
    if (!str.trim()) continue;
    const [a, b, c, d, e, f] = raw.transform as number[];
    items.push({
      str,
      x: e - x0,
      y: y1 - f,
      width: raw.width,
      size: Math.round(Math.hypot(c, d) * 100) / 100 || Math.round(Math.hypot(a, b) * 100) / 100,
      font: raw.fontName,
    });
  }

  try {
    const list = await page.getOperatorList();
    assignColors(items, colorRuns(list.fnArray, list.argsArray as unknown[][], ops));
  } catch {
    // Colours are a hint for parsing; without them the parser falls back on size.
  }

  const links: PdfLink[] = [];
  for (const ann of (await page.getAnnotations()) as { subtype?: string; url?: string; unsafeUrl?: string; rect: number[] }[]) {
    const url = ann.url ?? ann.unsafeUrl;
    if (ann.subtype !== 'Link' || !url) continue;
    const [ax0, ay0, ax1, ay1] = ann.rect;
    links.push({ url, x: ax0 - x0, y: y1 - ay1, width: ax1 - ax0, height: ay1 - ay0 });
  }

  page.cleanup();
  return { width, height, items, links };
}

export async function extractContent(pdf: PDFDocumentProxy, ops: PdfOps): Promise<PdfContent> {
  const pages: PdfPage[] = [];
  for (let n = 1; n <= pdf.numPages; n++) pages.push(await readPage(pdf, n, ops));
  return { pages };
}
