import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { serializeCv } from '../model/normalize';
import type { CvDocument } from '../model/types';
import { saveCachedDocument } from './cache';

/** Where the current document came from. A handle means Save writes back to disk. */
export interface DocumentSource {
  name: string;
  handle?: FileSystemFileHandle;
  /** Saved in the repo's saves/ folder via the dev server. */
  repo?: boolean;
}

const AUTOSAVE_MS = 400;

/**
 * The working document, its file binding and its unsaved-changes state.
 * "Saved" means: identical to what was last opened, saved or exported.
 */
export function useCvDocument(initial: { doc: CvDocument; clean: boolean }) {
  const [doc, setDoc] = useState(initial.doc);
  const [savedJson, setSavedJson] = useState<string | null>(() =>
    initial.clean ? serializeCv(initial.doc) : null,
  );
  const [source, setSource] = useState<DocumentSource | null>(null);
  /** Bumped whenever a different document is loaded; the Editor is keyed on it. */
  const [generation, setGeneration] = useState(0);

  const json = useMemo(() => serializeCv(doc), [doc]);
  const dirty = json !== savedJson;

  useEffect(() => {
    const timer = setTimeout(() => saveCachedDocument(json, !dirty), AUTOSAVE_MS);
    return () => clearTimeout(timer);
  }, [json, dirty]);

  // The debounce above would lose the last keystrokes on reload or tab close,
  // so write immediately whenever the page is hidden or unloaded.
  const pending = useRef({ json, dirty });
  useLayoutEffect(() => {
    pending.current = { json, dirty };
  });
  useEffect(() => {
    const flush = () => saveCachedDocument(pending.current.json, !pending.current.dirty);
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') flush();
    };
    window.addEventListener('pagehide', flush);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('pagehide', flush);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  const update = useCallback((fn: (d: CvDocument) => CvDocument) => setDoc(fn), []);

  /** Swap in a whole document (open, import, demo). It matches its source. */
  const replace = useCallback((next: CvDocument, nextSource: DocumentSource | null) => {
    setDoc(next);
    setSavedJson(serializeCv(next));
    setSource(nextSource);
    setGeneration((g) => g + 1);
  }, []);

  const markSaved = useCallback((savedText: string, nextSource?: DocumentSource) => {
    setSavedJson(savedText);
    if (nextSource) setSource(nextSource);
  }, []);

  return { doc, json, dirty, source, generation, update, replace, markSaved };
}
