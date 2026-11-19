/**
 * Quick fixes offered on the PDF import review screen. Pure functions over
 * the document, so the review keeps one draft and can undo by discarding it.
 */
import type {
  CvDocument,
  EducationEntry,
  ExperienceEntry,
  ProjectEntry,
  SectionId,
} from '../model/types';

export type EntrySection = 'experience' | 'projects' | 'education';
export const ENTRY_SECTIONS: readonly EntrySection[] = ['experience', 'projects', 'education'];

/** What the three entry kinds have in common, for moving one into another. */
interface Common {
  id: string;
  title: string;
  sub?: string;
  start?: string;
  end?: string;
  location?: string;
  url?: string;
  /** Paragraphs and "- " bullets, as in a description. */
  body?: string;
  chips?: string[];
}

const lines = (text: string | undefined) =>
  (text ?? '')
    .split('\n')
    .map((l) => l.replace(/^- /u, '').trim())
    .filter(Boolean);

function toCommon(doc: CvDocument, section: EntrySection, id: string): Common | undefined {
  if (section === 'experience') {
    const e = doc.experience.find((x) => x.id === id);
    return e && { id, title: e.title, sub: e.org, start: e.start, end: e.end, location: e.location, body: e.description, chips: e.skills };
  }
  if (section === 'projects') {
    const p = doc.projects.find((x) => x.id === id);
    return p && { id, title: p.name, sub: p.role, start: p.start, end: p.end, url: p.url, body: p.description, chips: p.tech };
  }
  const e = doc.education.find((x) => x.id === id);
  return (
    e && {
      id,
      title: e.degree ?? e.institution,
      sub: e.degree ? e.institution : undefined,
      start: e.start,
      end: e.end,
      location: e.location,
      body: e.details?.map((d) => `- ${d}`).join('\n'),
    }
  );
}

/** Drops undefined and empty values, as the editor would. */
function tidy<T extends object>(entry: T): T {
  return Object.fromEntries(
    Object.entries(entry).filter(([, v]) => v !== undefined && v !== '' && !(Array.isArray(v) && v.length === 0)),
  ) as T;
}

function fromCommon(c: Common, section: EntrySection): ExperienceEntry | ProjectEntry | EducationEntry {
  const dates = { start: c.start, end: c.end };
  if (section === 'experience') {
    return tidy<ExperienceEntry>({ id: c.id, title: c.title, org: c.sub ?? '', ...dates, location: c.location, description: c.body, skills: c.chips });
  }
  if (section === 'projects') {
    return tidy<ProjectEntry>({ id: c.id, name: c.title, role: c.sub, ...dates, url: c.url, description: c.body, tech: c.chips });
  }
  const details = [...lines(c.body), ...(c.chips ?? [])];
  return tidy<EducationEntry>({
    id: c.id,
    institution: c.sub ?? c.title,
    degree: c.sub ? c.title : undefined,
    ...dates,
    location: c.location,
    details,
  });
}

/** Shows a section if it was hidden, keeping its place in the order. */
export function ensureVisible(doc: CvDocument, id: SectionId): CvDocument {
  if (doc.meta.sections.find((s) => s.id === id)?.visible) return doc;
  return {
    ...doc,
    meta: { ...doc.meta, sections: doc.meta.sections.map((s) => (s.id === id ? { ...s, visible: true } : s)) },
  };
}

export function moveEntry(doc: CvDocument, from: EntrySection, id: string, to: EntrySection): CvDocument {
  if (from === to) return doc;
  const common = toCommon(doc, from, id);
  if (!common) return doc;
  const removed = removeEntry(doc, from, id);
  return ensureVisible({ ...removed, [to]: [...removed[to], fromCommon(common, to)] }, to);
}

export function removeEntry(doc: CvDocument, section: EntrySection | 'skills' | 'languages', id: string): CvDocument {
  return { ...doc, [section]: (doc[section] as { id: string }[]).filter((x) => x.id !== id) };
}

/** Swaps an entry's title line and the line under it (job title ↔ company, and so on). */
export function swapTitle(doc: CvDocument, section: EntrySection, id: string): CvDocument {
  const c = toCommon(doc, section, id);
  if (!c || !c.sub) return doc;
  const swapped = fromCommon({ ...c, title: c.sub, sub: c.title }, section);
  return { ...doc, [section]: (doc[section] as { id: string }[]).map((x) => (x.id === id ? swapped : x)) };
}

export type PlaceTarget = { kind: 'about' } | { kind: 'entry'; section: EntrySection; id: string };

/** Adds leftover text to the About section, or as a bullet point on an entry. */
export function placeText(doc: CvDocument, text: string, target: PlaceTarget): CvDocument {
  if (target.kind === 'about') {
    const about = doc.identity.about?.trim();
    return ensureVisible({ ...doc, identity: { ...doc.identity, about: about ? `${about}\n\n${text}` : text } }, 'about');
  }
  const { section, id } = target;
  if (section === 'education') {
    return { ...doc, education: doc.education.map((e) => (e.id === id ? { ...e, details: [...(e.details ?? []), text] } : e)) };
  }
  const add = (d: string | undefined) => (d?.trim() ? `${d.trim()}\n- ${text}` : `- ${text}`);
  if (section === 'experience') {
    return { ...doc, experience: doc.experience.map((e) => (e.id === id ? { ...e, description: add(e.description) } : e)) };
  }
  return { ...doc, projects: doc.projects.map((p) => (p.id === id ? { ...p, description: add(p.description) } : p)) };
}

/** A short label for an entry, for "Add to…" menus. */
export function entryLabel(doc: CvDocument, section: EntrySection, id: string): string {
  const c = toCommon(doc, section, id);
  if (!c) return '';
  return [c.title, c.sub].filter(Boolean).join(' · ') || '(untitled)';
}
