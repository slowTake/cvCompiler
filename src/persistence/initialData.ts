import publicCv from '../../data/cv.public.json';
import { normalizeCv } from '../model/normalize';
import { emptyDocument } from '../model/defaults';
import type { CvDocument } from '../model/types';

/** The fictional demo CV that ships with the app. */
export function demoDocument(): CvDocument {
  const result = normalizeCv(publicCv);
  return result.ok ? result.doc : emptyDocument();
}

/**
 * data/cv.private.json, in dev only. The import.meta.env.DEV guard lets the
 * production build drop this branch, and vite.config.ts stubs the file out of
 * production builds as a second line of defence. The glob tolerates the file
 * being absent.
 */
export async function loadPrivateDocument(): Promise<CvDocument | null> {
  if (!import.meta.env.DEV) return null;
  const modules = import.meta.glob<unknown>('../../data/cv.private.json', { import: 'default' });
  const load = Object.values(modules)[0];
  if (!load) return null;
  const result = normalizeCv(await load());
  if (!result.ok) {
    console.warn('data/cv.private.json is invalid:', result.errors);
    return null;
  }
  return result.doc;
}

export const hasPrivateDocument: boolean =
  import.meta.env.DEV &&
  Object.keys(import.meta.glob('../../data/cv.private.json')).length > 0;
