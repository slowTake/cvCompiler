/**
 * PDF import: embedded CV data when the PDF came from cvCompiler, otherwise
 * the text-parsing fallback.
 */
import type { CvDocument } from '../model/types';
import { pdfText, type PdfContent } from './content';
import { decodeEmbed, isEmbedUrl, textDiffers } from './embed';
import { parsePdfContent, type ParsedCv } from './parse';
import { PDF_FAILURE_MESSAGES, PdfReadError } from './errors';

export type PdfImport =
  /** Exact restore. `modified`: the visible text no longer matches, so the PDF was edited elsewhere. */
  | { kind: 'embedded'; doc: CvDocument; modified: boolean }
  /** `damagedEmbed`: the PDF had cvCompiler data that couldn't be read. */
  | { kind: 'parsed'; result: ParsedCv; damagedEmbed: boolean };

export async function importPdfContent(content: PdfContent, opts: { ignoreEmbed?: boolean } = {}): Promise<PdfImport> {
  const embedUrl = content.pages.flatMap((p) => p.links).find((l) => isEmbedUrl(l.url))?.url;
  const text = pdfText(content);
  if (embedUrl && !opts.ignoreEmbed) {
    const doc = await decodeEmbed(embedUrl);
    if (doc) return { kind: 'embedded', doc, modified: textDiffers(doc, text) };
  }
  if (!text.trim()) throw new PdfReadError('no-text', PDF_FAILURE_MESSAGES['no-text']);
  return { kind: 'parsed', result: parsePdfContent(content), damagedEmbed: !!embedUrl && !opts.ignoreEmbed };
}
