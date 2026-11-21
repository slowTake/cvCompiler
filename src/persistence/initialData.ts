import publicCv from '../../data/cv.public.json';
import { normalizeCv } from '../model/normalize';
import { emptyDocument } from '../model/defaults';
import type { CvDocument } from '../model/types';

/** The fictional demo CV that ships with the app. */
export function demoDocument(): CvDocument {
  const result = normalizeCv(publicCv);
  return result.ok ? result.doc : emptyDocument();
}
