import { hasTemplate, DEFAULT_TEMPLATE } from '../templates/registry';
import { defaultSections, isSectionId } from './defaults';
import { descriptionFrom } from './description';
import { newId } from './id';
import { sanitizeStyle, STYLE_KEYS } from './style';
import {
  CONTACT_KINDS,
  CV_SCHEMA_VERSION,
  SECTION_IDS,
  type ContactItem,
  type ContactKind,
  type CvDocument,
  type CvMeta,
  type EducationEntry,
  type ExperienceEntry,
  type Identity,
  type LanguageEntry,
  type LinkItem,
  type ProjectEntry,
  type SectionConfig,
  type SectionId,
  type SkillGroup,
} from './types';

/** A problem at a JSON path such as `experience[2].title`. */
export interface CvIssue {
  path: string;
  message: string;
}

export type ParseResult =
  | {
      ok: true;
      doc: CvDocument;
      /** Optional values that were invalid and quietly removed. */
      dropped: CvIssue[];
    }
  | { ok: false; errors: CvIssue[] };

const MAX_ERRORS = 25;

type Obj = Record<string, unknown>;

const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v);

const describe = (v: unknown): string =>
  v === null ? 'null' : Array.isArray(v) ? 'an array' : typeof v === 'object' ? 'an object' : typeof v;

class Ctx {
  errors: CvIssue[] = [];
  dropped: CvIssue[] = [];
  error(path: string, message: string) {
    if (this.errors.length < MAX_ERRORS) this.errors.push({ path, message });
  }
  drop(path: string, message: string) {
    this.dropped.push({ path, message });
  }
}

const join = (base: string, key: string | number) =>
  typeof key === 'number' ? `${base}[${key}]` : base ? `${base}.${key}` : key;

/** A required plain-text field. Empty strings are allowed (entries being edited). */
function reqText(ctx: Ctx, obj: Obj, key: string, path: string): string {
  const v = obj[key];
  if (typeof v === 'string') return v;
  if (typeof v === 'number' && Number.isFinite(v)) return String(v);
  ctx.error(join(path, key), v === undefined ? 'is required' : `must be text, got ${describe(v)}`);
  return '';
}

/** An optional plain-text field. Empty or invalid values become undefined. */
function optText(ctx: Ctx, obj: Obj, key: string, path: string): string | undefined {
  const v = obj[key];
  if (v === undefined || v === null) return undefined;
  if (typeof v === 'number' && Number.isFinite(v)) return String(v);
  if (typeof v !== 'string') {
    ctx.drop(join(path, key), `expected text, got ${describe(v)}`);
    return undefined;
  }
  return v.trim() === '' ? undefined : v;
}

/** A list of plain-text lines. Non-text items are dropped; a lone string becomes one item. */
function textList(ctx: Ctx, obj: Obj, key: string, path: string): string[] | undefined {
  const v = obj[key];
  if (v === undefined || v === null) return undefined;
  if (typeof v === 'string') return v.trim() ? [v] : undefined;
  if (!Array.isArray(v)) {
    ctx.drop(join(path, key), `expected a list of text, got ${describe(v)}`);
    return undefined;
  }
  const out: string[] = [];
  v.forEach((item, i) => {
    if (typeof item === 'string') {
      if (item.trim()) out.push(item);
    } else if (typeof item === 'number' && Number.isFinite(item)) {
      out.push(String(item));
    } else {
      ctx.drop(join(join(path, key), i), `expected text, got ${describe(item)}`);
    }
  });
  return out;
}

/**
 * An entry's description. Version 1 files kept a `summary` paragraph and a
 * `bullets` list apart; they are folded into one description, summary first.
 */
function description(ctx: Ctx, obj: Obj, path: string): string | undefined {
  const text = optText(ctx, obj, 'description', path);
  if (text !== undefined) return text;
  const legacy = descriptionFrom(optText(ctx, obj, 'summary', path), textList(ctx, obj, 'bullets', path));
  return legacy || undefined;
}

/** Assigns ids that are missing or duplicated within one list. */
function idFor(raw: Obj, seen: Set<string>): string {
  const candidate = typeof raw.id === 'string' && raw.id.trim() ? raw.id : undefined;
  const id = candidate && !seen.has(candidate) ? candidate : newId();
  seen.add(id);
  return id;
}

/** A list of entry objects. Missing → []. Wrong shape → structural error. */
function entryList<T>(
  ctx: Ctx,
  obj: Obj,
  key: string,
  path: string,
  build: (raw: Obj, path: string, id: string) => T,
): T[] {
  const v = obj[key];
  const listPath = join(path, key);
  if (v === undefined || v === null) return [];
  if (!Array.isArray(v)) {
    ctx.error(listPath, `must be a list, got ${describe(v)}`);
    return [];
  }
  const seen = new Set<string>();
  const out: T[] = [];
  v.forEach((item, i) => {
    const itemPath = join(listPath, i);
    if (!isObj(item)) {
      ctx.error(itemPath, `must be an object, got ${describe(item)}`);
      return;
    }
    out.push(build(item, itemPath, idFor(item, seen)));
  });
  return out;
}

/** Removes keys whose value is undefined so documents serialise cleanly. */
function compact<T extends object>(value: T): T {
  for (const key of Object.keys(value) as (keyof T)[]) {
    if (value[key] === undefined) delete value[key];
  }
  return value;
}

function nonEmpty(list: string[] | undefined): string[] | undefined {
  return list && list.length > 0 ? list : undefined;
}

function normalizeSections(ctx: Ctx, raw: unknown, path: string): SectionConfig[] {
  if (raw === undefined || raw === null) return defaultSections();
  if (!Array.isArray(raw)) {
    ctx.drop(path, `expected a list, got ${describe(raw)}`);
    return defaultSections();
  }
  const seen = new Set<SectionId>();
  const out: SectionConfig[] = [];
  raw.forEach((item, i) => {
    const itemPath = join(path, i);
    const id = typeof item === 'string' ? item : isObj(item) ? item.id : undefined;
    if (!isSectionId(id)) {
      ctx.drop(itemPath, `unknown section ${JSON.stringify(id)}`);
      return;
    }
    if (seen.has(id)) {
      ctx.drop(itemPath, `duplicate section "${id}"`);
      return;
    }
    seen.add(id);
    const config: SectionConfig = { id, visible: true };
    if (isObj(item)) {
      if (typeof item.visible === 'boolean') config.visible = item.visible;
      else if (item.visible !== undefined) ctx.drop(join(itemPath, 'visible'), 'expected true or false');
      const title = optText(ctx, item, 'title', itemPath);
      if (title) config.title = title;
    }
    out.push(config);
  });
  // A file that lists only some sections keeps the rest, hidden, at the end.
  for (const id of SECTION_IDS) {
    if (!seen.has(id)) out.push({ id, visible: false });
  }
  return out;
}

function normalizeMeta(ctx: Ctx, raw: unknown, fallbackTitle: string): CvMeta {
  const path = 'meta';
  const meta: CvMeta = {
    title: fallbackTitle,
    templateId: DEFAULT_TEMPLATE.id,
    sections: defaultSections(),
  };
  if (raw === undefined || raw === null) return meta;
  if (!isObj(raw)) {
    ctx.error(path, `must be an object, got ${describe(raw)}`);
    return meta;
  }
  meta.title = optText(ctx, raw, 'title', path) ?? fallbackTitle;

  if (typeof raw.templateId === 'string' && hasTemplate(raw.templateId)) {
    meta.templateId = raw.templateId;
  } else if (raw.templateId !== undefined) {
    ctx.drop(join(path, 'templateId'), `unknown template ${JSON.stringify(raw.templateId)}`);
  }

  if (raw.style !== undefined) {
    const style = sanitizeStyle(raw.style);
    const rawKeys = isObj(raw.style) ? Object.keys(raw.style) : [];
    for (const key of rawKeys) {
      const known = (STYLE_KEYS as readonly string[]).includes(key);
      if (!known || !style || !(key in style)) {
        ctx.drop(join(join(path, 'style'), key), known ? 'invalid value' : 'unknown style option');
      }
    }
    if (style) meta.style = style;
  }

  meta.sections = normalizeSections(ctx, raw.sections, join(path, 'sections'));
  return meta;
}

function contactKind(ctx: Ctx, raw: Obj, path: string): ContactKind {
  const v = raw.kind;
  if (typeof v === 'string' && (CONTACT_KINDS as readonly string[]).includes(v)) return v as ContactKind;
  if (v !== undefined) ctx.drop(join(path, 'kind'), `unknown contact kind ${JSON.stringify(v)}`);
  return 'other';
}

function normalizeIdentity(ctx: Ctx, raw: unknown): Identity {
  const path = 'identity';
  if (!isObj(raw)) {
    ctx.error(path, raw === undefined ? 'is required' : `must be an object, got ${describe(raw)}`);
    return { name: '', contact: [] };
  }
  const contact = entryList<ContactItem>(ctx, raw, 'contact', path, (item, p, id) =>
    compact({
      id,
      kind: contactKind(ctx, item, p),
      value: reqText(ctx, item, 'value', p),
      href: optText(ctx, item, 'href', p),
    }),
  );
  const links = entryList<LinkItem>(ctx, raw, 'links', path, (item, p, id) =>
    compact({ id, url: reqText(ctx, item, 'url', p), label: optText(ctx, item, 'label', p) }),
  );
  return compact({
    name: reqText(ctx, raw, 'name', path),
    role: optText(ctx, raw, 'role', path),
    about: optText(ctx, raw, 'about', path),
    contact,
    links: links.length > 0 ? links : undefined,
  });
}

/** Validates and normalises an already-parsed JSON value into a CvDocument. */
export function normalizeCv(input: unknown): ParseResult {
  const ctx = new Ctx();
  if (!isObj(input)) {
    return {
      ok: false,
      errors: [{ path: '(root)', message: `must be a JSON object, got ${describe(input)}` }],
    };
  }

  if (input.version !== undefined) {
    if (typeof input.version !== 'number' || !Number.isInteger(input.version)) {
      ctx.error('version', 'must be a whole number');
    } else if (input.version > CV_SCHEMA_VERSION) {
      ctx.error(
        'version',
        `is ${input.version}, but this app understands up to version ${CV_SCHEMA_VERSION}`,
      );
    }
  }

  const identity = normalizeIdentity(ctx, input.identity);
  const meta = normalizeMeta(ctx, input.meta, identity.name.trim() || 'Untitled CV');

  const skills = entryList<SkillGroup>(ctx, input, 'skills', '', (raw, p, id) => ({
    id,
    name: reqText(ctx, raw, 'name', p),
    items: textList(ctx, raw, 'items', p) ?? [],
  }));

  const education = entryList<EducationEntry>(ctx, input, 'education', '', (raw, p, id) =>
    compact({
      id,
      institution: reqText(ctx, raw, 'institution', p),
      degree: optText(ctx, raw, 'degree', p),
      start: optText(ctx, raw, 'start', p),
      end: optText(ctx, raw, 'end', p),
      location: optText(ctx, raw, 'location', p),
      details: nonEmpty(textList(ctx, raw, 'details', p)),
    }),
  );

  const projects = entryList<ProjectEntry>(ctx, input, 'projects', '', (raw, p, id) =>
    compact({
      id,
      name: reqText(ctx, raw, 'name', p),
      role: optText(ctx, raw, 'role', p),
      start: optText(ctx, raw, 'start', p),
      end: optText(ctx, raw, 'end', p),
      url: optText(ctx, raw, 'url', p),
      description: description(ctx, raw, p),
      tech: nonEmpty(textList(ctx, raw, 'tech', p)),
    }),
  );

  const experience = entryList<ExperienceEntry>(ctx, input, 'experience', '', (raw, p, id) =>
    compact({
      id,
      title: reqText(ctx, raw, 'title', p),
      org: reqText(ctx, raw, 'org', p),
      start: optText(ctx, raw, 'start', p),
      end: optText(ctx, raw, 'end', p),
      location: optText(ctx, raw, 'location', p),
      description: description(ctx, raw, p),
      skills: nonEmpty(textList(ctx, raw, 'skills', p)),
    }),
  );

  const languages = entryList<LanguageEntry>(ctx, input, 'languages', '', (raw, p, id) =>
    compact({ id, name: reqText(ctx, raw, 'name', p), level: optText(ctx, raw, 'level', p) }),
  );

  if (ctx.errors.length > 0) return { ok: false, errors: ctx.errors };

  return {
    ok: true,
    dropped: ctx.dropped,
    doc: {
      version: CV_SCHEMA_VERSION,
      meta,
      identity,
      skills,
      education,
      projects,
      experience,
      languages,
    },
  };
}

/** Parses JSON text, then validates and normalises it. */
export function parseCvJson(text: string): ParseResult {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    return { ok: false, errors: [{ path: '(file)', message: `is not valid JSON: ${detail}` }] };
  }
  return normalizeCv(data);
}

export function serializeCv(doc: CvDocument): string {
  return `${JSON.stringify(doc, null, 2)}\n`;
}

export function formatIssues(issues: CvIssue[]): string[] {
  return issues.map((i) => `${i.path} ${i.message}`);
}
