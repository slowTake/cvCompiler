/**
 * What PDF import reads from a PDF: positioned text, links and colours, as
 * plain data. Produced by extract.ts with pdf.js; everything after that
 * (embed lookup, parsing) works on this shape alone, so it is testable
 * without a PDF engine.
 *
 * Coordinates are PDF points with the origin at the page's top-left.
 */

export interface PdfTextItem {
  str: string;
  x: number;
  /** Baseline, measured from the top of the page. */
  y: number;
  width: number;
  /** Font size in points. */
  size: number;
  /** pdf.js font id; distinguishes weights and families within one file. */
  font: string;
  /** Fill colour as #rrggbb, when known. */
  color?: string;
}

export interface PdfLink {
  url: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PdfPage {
  width: number;
  height: number;
  items: PdfTextItem[];
  links: PdfLink[];
}

export interface PdfContent {
  pages: PdfPage[];
}

/**
 * "A B O U T" (CSS letter-spacing) → "ABOUT". Kerning sometimes glues pairs
 * ("E X P E R I E NC E"), so short tokens count too; wider gaps stay word breaks.
 */
export function collapseLetterSpacing(text: string): string {
  const words = text.trim().split(/\s{2,}/);
  const spaced = words.every((w) => {
    const tokens = w.split(' ');
    const letters = tokens.join('').length;
    const singles = tokens.filter((t) => [...t].length === 1).length;
    // Mostly single letters, or all caps in short clusters ("E DUC AT I ON").
    return (
      (tokens.length >= 4 && tokens.every((t) => [...t].length <= 3) && singles >= tokens.length * 0.6) ||
      (tokens.length >= 3 && tokens.every((t) => /^\p{Lu}+$/u.test(t)) && letters / tokens.length <= 2.5)
    );
  });
  return spaced ? words.map((w) => w.replace(/ /g, '')).join(' ') : text;
}

export function pdfText(content: PdfContent): string {
  return content.pages.map((p) => p.items.map((i) => collapseLetterSpacing(i.str)).join(' ')).join('\n');
}
