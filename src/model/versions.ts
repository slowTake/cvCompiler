import { newId } from './id';
import type { CvDocument, CvMeta, CvVersion } from './types';

/**
 * Versions of one CV. All versions share the same content (identity and the
 * entry lists); each has its own meta: template, style, section order and
 * visibility, and the entries it leaves out (`meta.excluded`).
 * The original version's meta is `doc.meta`; the others live in `doc.versions`.
 */
export const ORIGINAL_VERSION_ID = 'original';
export const ORIGINAL_VERSION_NAME = 'Original';

export interface VersionTab {
  id: string;
  name: string;
}

export function versionTabs(doc: CvDocument): VersionTab[] {
  return [
    { id: ORIGINAL_VERSION_ID, name: ORIGINAL_VERSION_NAME },
    ...(doc.versions ?? []).map(({ id, name }) => ({ id, name })),
  ];
}

export function hasVersion(doc: CvDocument, id: string): boolean {
  return id === ORIGINAL_VERSION_ID || !!doc.versions?.some((v) => v.id === id);
}

export function metaFor(doc: CvDocument, id: string): CvMeta {
  if (id === ORIGINAL_VERSION_ID) return doc.meta;
  return doc.versions?.find((v) => v.id === id)?.meta ?? doc.meta;
}

export function setMetaFor(doc: CvDocument, id: string, meta: CvMeta): CvDocument {
  if (id === ORIGINAL_VERSION_ID) return { ...doc, meta };
  return { ...doc, versions: doc.versions?.map((v) => (v.id === id ? { ...v, meta } : v)) };
}

/** The document as the editor sees it while a version is active: that version's meta. */
export function editorView(doc: CvDocument, id: string): CvDocument {
  return id === ORIGINAL_VERSION_ID ? doc : { ...doc, meta: metaFor(doc, id) };
}

/** Writes an edited editor view back: content is shared, meta goes to the version. */
export function fromEditorView(doc: CvDocument, id: string, view: CvDocument): CvDocument {
  return setMetaFor({ ...view, meta: doc.meta, versions: doc.versions }, id, view.meta);
}

/** The plain CV of one version, with its excluded entries removed, for preview and print. */
export function renderedVersion(doc: CvDocument, id: string): CvDocument {
  const { excluded, ...meta } = metaFor(doc, id);
  const out = { ...doc, meta };
  delete out.versions;
  if (!excluded?.length) return out;
  const skip = new Set(excluded);
  const keep = <T extends { id: string }>(list: T[]) => list.filter((item) => !skip.has(item.id));
  const links = doc.identity.links && keep(doc.identity.links);
  const identity = { ...doc.identity, contact: keep(doc.identity.contact) };
  if (links?.length) identity.links = links;
  else delete identity.links;
  return {
    ...out,
    identity,
    skills: keep(doc.skills),
    education: keep(doc.education),
    projects: keep(doc.projects),
    experience: keep(doc.experience),
    languages: keep(doc.languages),
  };
}

export function isIncluded(doc: CvDocument, versionId: string, itemId: string): boolean {
  return !metaFor(doc, versionId).excluded?.includes(itemId);
}

export function toggleIncluded(doc: CvDocument, versionId: string, itemId: string): CvDocument {
  const meta = metaFor(doc, versionId);
  const current = meta.excluded ?? [];
  const excluded = current.includes(itemId) ? current.filter((x) => x !== itemId) : [...current, itemId];
  const next: CvMeta = { ...meta, excluded };
  if (excluded.length === 0) delete next.excluded;
  return setMetaFor(doc, versionId, next);
}

/** "Version 2", "Version 3", … skipping names already taken. */
export function nextVersionName(doc: CvDocument): string {
  const taken = new Set(versionTabs(doc).map((t) => t.name));
  let n = (doc.versions?.length ?? 0) + 2;
  while (taken.has(`Version ${n}`)) n += 1;
  return `Version ${n}`;
}

/** Adds a copy of version `fromId` (design, layout and what it includes). */
export function addVersion(doc: CvDocument, fromId: string): { doc: CvDocument; id: string } {
  const id = newId();
  const meta = structuredClone(metaFor(doc, fromId));
  const version: CvVersion = { id, name: nextVersionName(doc), meta };
  return { doc: { ...doc, versions: [...(doc.versions ?? []), version] }, id };
}

export function renameVersion(doc: CvDocument, id: string, name: string): CvDocument {
  const trimmed = name.trim();
  if (!trimmed || id === ORIGINAL_VERSION_ID) return doc;
  return { ...doc, versions: doc.versions?.map((v) => (v.id === id ? { ...v, name: trimmed } : v)) };
}

export function removeVersion(doc: CvDocument, id: string): CvDocument {
  const versions = doc.versions?.filter((v) => v.id !== id) ?? [];
  const out: CvDocument = { ...doc, versions };
  if (versions.length === 0) delete out.versions;
  return out;
}
