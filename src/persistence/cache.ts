/**
 * localStorage is a cache, not the source of truth: it restores your work
 * after a reload. Files on disk (or exported JSON) are the real copies.
 * Every access is wrapped because storage can be missing, full or blocked.
 */
import { normalizeCv } from '../model/normalize';
import type { CvDocument } from '../model/types';

const DOC_KEY = 'cvstudio.document.v1';
const UI_PREFIX = 'cvstudio.ui.';

interface CachedDocument {
  doc: unknown;
  /** True when the cached document matched the last saved / opened file. */
  clean: boolean;
}

export function loadCachedDocument(): { doc: CvDocument; clean: boolean } | undefined {
  try {
    const raw = localStorage.getItem(DOC_KEY);
    if (!raw) return undefined;
    const parsed = JSON.parse(raw) as CachedDocument;
    const result = normalizeCv(parsed.doc);
    return result.ok ? { doc: result.doc, clean: parsed.clean === true } : undefined;
  } catch {
    return undefined;
  }
}

/** `json` is the serialised document (see serializeCv). */
export function saveCachedDocument(json: string, clean: boolean): void {
  try {
    const payload = `{"clean":${clean},"doc":${json}}`;
    localStorage.setItem(DOC_KEY, payload);
  } catch {
    // Storage full or unavailable: the cache is best-effort.
  }
}

export function loadUiState<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(UI_PREFIX + key);
    return raw === null ? fallback : (JSON.parse(raw) as T);
  } catch {
    return fallback;
  }
}

export function saveUiState(key: string, value: unknown): void {
  try {
    localStorage.setItem(UI_PREFIX + key, JSON.stringify(value));
  } catch {
    // Best-effort.
  }
}
