/**
 * The CV data that rides along inside an exported PDF.
 *
 * Print → Save as PDF gives the page no say over the PDF itself: no
 * attachments, no custom metadata. Links survive, though, and a link's target
 * is not part of the text layer. So PrintRoot adds one empty 2px link whose
 * URL carries the document, zlib-compressed and base64url-encoded. Firefox
 * and Chromium both keep it (an opacity:0 link is dropped by Chromium, and
 * any text inside the link would leak into copy-paste and ATS parsers).
 *
 * Only visible sections are embedded: anyone can read a PDF's links, and the
 * PDF should not carry content the person chose to leave off their CV.
 */
import { normalizeCv } from '../model/normalize';
import type { CvDocument } from '../model/types';

/** `.invalid` is a reserved TLD: clicking the link can never reach a real site. */
export const EMBED_PREFIX = 'https://cvcompiler.invalid/#cv1.';

/** The document with hidden sections' content removed. Their settings stay. */
export function visibleOnly(doc: CvDocument): CvDocument {
  const hidden = new Set(doc.meta.sections.filter((s) => !s.visible).map((s) => s.id));
  const { about: _about, ...identity } = doc.identity;
  return {
    ...doc,
    identity: hidden.has('about') ? identity : doc.identity,
    skills: hidden.has('skills') ? [] : doc.skills,
    experience: hidden.has('experience') ? [] : doc.experience,
    projects: hidden.has('projects') ? [] : doc.projects,
    education: hidden.has('education') ? [] : doc.education,
    languages: hidden.has('languages') ? [] : doc.languages,
  };
}

export function hasHiddenSections(doc: CvDocument): boolean {
  return doc.meta.sections.some((s) => !s.visible);
}

async function pipe(bytes: Uint8Array, stream: CompressionStream | DecompressionStream): Promise<Uint8Array> {
  const out = new Blob([bytes as BlobPart]).stream().pipeThrough(stream);
  return new Uint8Array(await new Response(out).arrayBuffer());
}

function toBase64Url(bytes: Uint8Array): string {
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) {
    bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(text: string): Uint8Array {
  const bin = atob(text.replace(/-/g, '+').replace(/_/g, '/'));
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

/** The link target that carries `doc`'s visible content. */
export async function encodeEmbed(doc: CvDocument): Promise<string> {
  const json = JSON.stringify(visibleOnly(doc));
  // 'deflate' (zlib) has a checksum, so a damaged payload fails to decode
  // instead of loading garbage.
  const packed = await pipe(new TextEncoder().encode(json), new CompressionStream('deflate'));
  return EMBED_PREFIX + toBase64Url(packed);
}

export function isEmbedUrl(url: string): boolean {
  return url.startsWith(EMBED_PREFIX);
}

/** Decodes an embed link back into a document. Null when it is damaged or invalid. */
export async function decodeEmbed(url: string): Promise<CvDocument | null> {
  if (!isEmbedUrl(url)) return null;
  try {
    const bytes = await pipe(fromBase64Url(url.slice(EMBED_PREFIX.length)), new DecompressionStream('deflate'));
    const result = normalizeCv(JSON.parse(new TextDecoder().decode(bytes)));
    return result.ok ? result.doc : null;
  } catch {
    return null;
  }
}

/** Lower-case words of two or more letters or digits. */
export function words(text: string): string[] {
  return text.toLowerCase().match(/[\p{L}\p{N}]{2,}/gu) ?? [];
}

/** Words that the rendering adds on its own, beyond the document's content. */
const RENDER_WORDS = ['skills', 'developed', 'your', 'name', 'role', 'project', 'institution'];

/** Fields that never appear on the page as written. `url` shows only without a label. */
const OFF_PAGE_KEYS = new Set(['id', 'href', 'kind', 'url']);

function collectText(value: unknown, out: string[]): void {
  if (typeof value === 'string') out.push(value);
  else if (Array.isArray(value)) value.forEach((v) => collectText(v, out));
  else if (value && typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) if (!OFF_PAGE_KEYS.has(k)) collectText(v, out);
  }
}

/** Words the document puts on the page, and words it may put there. */
function documentWords(doc: CvDocument): { shown: Set<string>; possible: Set<string> } {
  const shown: string[] = [];
  const { meta: _meta, version: _version, ...content } = doc;
  collectText(content, shown);
  const possible = [...shown, ...RENDER_WORDS, JSON.stringify(content)];
  for (const s of doc.meta.sections) possible.push(s.id, s.title ?? '');
  return { shown: new Set(words(shown.join(' '))), possible: new Set(words(possible.join(' '))) };
}

/**
 * Whether the PDF's visible text no longer matches the embedded document,
 * which means the PDF was edited elsewhere after export. Compares word sets,
 * so line wrapping, case transforms and layout do not matter.
 */
export function textDiffers(doc: CvDocument, pdfText: string): boolean {
  const { shown, possible } = documentWords(doc);
  const found = words(pdfText);
  if (found.length === 0) return true;
  const unexpected = found.filter((w) => !possible.has(w));
  const seen = new Set(found);
  const missing = [...shown].filter((w) => !seen.has(w));
  return unexpected.length >= 3 || missing.length >= 3;
}
