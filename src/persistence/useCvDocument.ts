import { useCallback, useEffect, useMemo, useState } from 'react';
import { serializeCv } from '../model/normalize';
import type { CvDocument } from '../model/types';
import { saveCachedDocument } from './cache';

/** Where the current document came from. A handle means Save writes back to disk. */
export interface DocumentSource {
  name: string;
  handle?: FileSystemFileHandle;
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

  const json = useMemo(() => serializeCv(doc), [doc]);
  const dirty = json !== savedJson;

  useEffect(() => {
    const timer = setTimeout(() => saveCachedDocument(json, !dirty), AUTOSAVE_MS);
    return () => clearTimeout(timer);
  }, [json, dirty]);

  const update = useCallback((fn: (d: CvDocument) => CvDocument) => setDoc(fn), []);

  /** Swap in a whole document (open, import, demo) that matches its source. */
  const replace = useCallback((next: CvDocument, nextSource: DocumentSource | null) => {
    setDoc(next);
    setSavedJson(serializeCv(next));
    setSource(nextSource);
  }, []);

  const markSaved = useCallback((savedText: string, nextSource?: DocumentSource) => {
    setSavedJson(savedText);
    if (nextSource) setSource(nextSource);
  }, []);

  return { doc, json, dirty, source, update, replace, markSaved };
}
