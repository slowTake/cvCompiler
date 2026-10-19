/**
 * localStorage is a cache, not the source of truth: it restores your work
 * after a reload. Files on disk (or exported JSON) are the real copies.
 * Every access is wrapped because storage can be missing, full or blocked.
 */
import { normalizeCv } from '../model/normalize';
import type { CvDocument } from '../model/types';

const DOC_KEY = 'cvstudio.document.v1';
const UI_PREFIX = 'cvstudio.ui.';
/**
 * Where the first cvStudio (commit 094fa69) cached the bare document, in the
 * order it read them. Read only while DOC_KEY is empty, and never removed, so
 * the old copy stays as a fallback.
 */
const LEGACY_DOC_KEYS = ['cvstudio:cv', 'cvstudio:demo', 'cvstudio:public'];

interface CachedDocument {
  doc: unknown;
  /** True when the cached document matched the last saved / opened file. */
  clean: boolean;
}

export function loadCachedDocument(): { doc: CvDocument; clean: boolean } | undefined {
  try {
    const raw = localStorage.getItem(DOC_KEY);
    if (!raw) return loadLegacyCachedDocument();
    const parsed = JSON.parse(raw) as CachedDocument;
    const result = normalizeCv(parsed.doc);
    return result.ok ? { doc: result.doc, clean: parsed.clean === true } : undefined;
  } catch {
    return undefined;
  }
}

/**
 * The first cvStudio's cached document, upgraded. It is never "clean": no file
 * in the current format matches it yet. The autosave writes DOC_KEY shortly
 * after load, so this is read once.
 */
function loadLegacyCachedDocument(): { doc: CvDocument; clean: boolean } | undefined {
  for (const key of LEGACY_DOC_KEYS) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const result = normalizeCv(JSON.parse(raw));
      if (result.ok) return { doc: result.doc, clean: false };
    } catch {
      // Unreadable or not JSON: try the next key.
    }
  }
  return undefined;
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
