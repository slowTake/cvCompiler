/**
 * Reads documents saved by the first cvStudio (before the rebuild, commit
 * 094fa69). Those files have no `version` and use older field names; this
 * module renames them to the current schema so normalizeCv can validate the
 * result like any other file. See "Files from the first cvStudio" in
 * docs/DATA-MODEL.md.
 *
 * Nothing here validates: values are moved, never checked, so bad values
 * still reach normalizeCv and are reported with their (new) paths.
 */
import { contactHref } from './links';
import { CONTACT_KINDS, type ContactKind, type SectionId } from './types';

type Obj = Record<string, unknown>;

const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v);

/** Old template ids that no longer exist → the nearest current template on the same skeleton. */
export const LEGACY_TEMPLATE_IDS: Readonly<Record<string, string>> = {
  noir: 'studio', // monospace sidebar
  forest: 'fern', // green, serif sidebar
  rose: 'studio', // pink sidebar
  ats: 'classic', // plain single column
  azure: 'minimal', // sans-serif single column
  modern: 'harbor', // coloured header band, sans
  bold: 'graphite', // dark header band
};

/** The old app showed sections in this order when a file had no `sectionOrder`. */
const LEGACY_SECTION_ORDER: readonly SectionId[] = [
  'about',
  'skills',
  'education',
  'projects',
  'experience',
  'languages',
];

const list = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);
const entries = (v: unknown): Obj[] => list(v).filter(isObj);

/** True when the value has a field only the old schema used. */
export function isLegacyCv(input: Obj): boolean {
  if (input.version !== undefined) return false;
  if ('sectionOrder' in input || 'sectionsEnabled' in input) return true;
  const identity = isObj(input.identity) ? input.identity : {};
  return (
    entries(identity.contact).some((c) => 'type' in c && !('kind' in c)) ||
    entries(identity.links).some((l) => 'href' in l && !('url' in l)) ||
    entries(input.skills).some((g) => ('title' in g && !('name' in g)) || entries(g.items).length > 0) ||
    entries(input.education).some((e) => 'org' in e && !('institution' in e)) ||
    entries(input.projects).some((p) => 'title' in p && !('name' in p)) ||
    entries(input.experience).some((e) => 'skillsDeveloped' in e)
  );
}

/**
 * Returns the document in the current schema's field names. Input that is not
 * an old-format file (see isLegacyCv) is returned unchanged.
 */
export function upgradeLegacyCv(input: Obj): Obj {
  if (!isLegacyCv(input)) return input;
  const { sectionOrder, sectionsEnabled, ...rest } = input;
  const out: Obj = { ...rest };
  out.meta = upgradeMeta(input.meta, sectionOrder, sectionsEnabled);
  if (isObj(input.identity)) out.identity = upgradeIdentity(input.identity);
  mapList(out, 'skills', upgradeSkillGroup);
  mapList(out, 'education', upgradeEducation);
  mapList(out, 'projects', upgradeProject);
  mapList(out, 'experience', upgradeExperience);
  return out;
}

/** Replaces each object entry of `out[key]`; leaves non-lists for normalizeCv to report. */
function mapList(out: Obj, key: string, upgrade: (entry: Obj) => Obj) {
  const v = out[key];
  if (Array.isArray(v)) out[key] = v.map((item) => (isObj(item) ? upgrade(item) : item));
}

function upgradeMeta(raw: unknown, order: unknown, enabled: unknown): unknown {
  if (raw !== undefined && !isObj(raw)) return raw;
  // `locale` and `updatedAt` were bookkeeping the current app does not use.
  const { locale: _locale, updatedAt: _updatedAt, ...meta } = raw ?? {};
  const templateId = meta.templateId;
  if (typeof templateId === 'string') {
    const trimmed = templateId.trim();
    meta.templateId = LEGACY_TEMPLATE_IDS[trimmed] ?? trimmed;
    if (meta.templateId === '') delete meta.templateId;
  }
  if (meta.sections === undefined) meta.sections = upgradeSections(order, enabled);
  return meta;
}

/**
 * `sectionOrder` + `sectionsEnabled` → `meta.sections`. A section was shown
 * unless `sectionsEnabled` said false; sections missing from `sectionOrder`
 * were not shown, so normalizeCv adds them hidden.
 */
function upgradeSections(order: unknown, enabled: unknown): unknown {
  if (order !== undefined && !Array.isArray(order)) return order;
  const flags = isObj(enabled) ? enabled : {};
  return (order ?? LEGACY_SECTION_ORDER).map((id) =>
    typeof id === 'string' ? { id, visible: flags[id] !== false } : id,
  );
}

function upgradeIdentity(identity: Obj): Obj {
  const out: Obj = { ...identity };
  if (Array.isArray(identity.contact)) {
    out.contact = identity.contact.map((c) => (isObj(c) ? upgradeContact(c) : c));
  }
  if (Array.isArray(identity.links)) {
    out.links = identity.links.map((l) => {
      if (!isObj(l) || 'url' in l) return l;
      const { href, ...link } = l;
      return { ...link, url: href };
    });
  }
  return out;
}

/** `{ type, label, value, href, icon }` → `{ kind, label, value, href }`. */
function upgradeContact(contact: Obj): Obj {
  if ('kind' in contact) return contact;
  // `icon` only repeated the type.
  const { type, icon: _icon, ...out } = contact;
  const kind = contactKindFor(type, contact.href, contact.value);
  out.kind = kind;
  // The old app stored links it could have derived. Keep only those the
  // current app would not build from kind + value itself.
  if (
    isContactKind(kind) &&
    typeof out.href === 'string' &&
    typeof out.value === 'string' &&
    contactHref({ id: '', kind, value: out.value }) === out.href.trim()
  ) {
    delete out.href;
  }
  return out;
}

const isContactKind = (v: unknown): v is ContactKind =>
  typeof v === 'string' && (CONTACT_KINDS as readonly string[]).includes(v);

/** Old types were email, phone, location and link; a link's kind comes from its host. */
function contactKindFor(type: unknown, href: unknown, value: unknown): unknown {
  if (type !== 'link') return type;
  const target = [href, value].find((v): v is string => typeof v === 'string' && v.trim() !== '');
  const host = hostOf(target);
  const kind: ContactKind =
    host === 'github.com' || host?.endsWith('.github.com')
      ? 'github'
      : host === 'linkedin.com' || host?.endsWith('.linkedin.com')
        ? 'linkedin'
        : 'website';
  return kind;
}

function hostOf(target: string | undefined): string | undefined {
  if (!target) return undefined;
  const value = target.trim();
  try {
    return new URL(/^[a-z][a-z0-9+.-]*:/i.test(value) ? value : `https://${value}`).hostname
      .toLowerCase()
      .replace(/^www\./, '');
  } catch {
    return undefined;
  }
}

/** `{ title, items: [{ label, href }] }` → `{ name, items: string[], links }`. */
function upgradeSkillGroup(group: Obj): Obj {
  const { title, ...out } = group;
  if (!('name' in out)) out.name = title;
  if (Array.isArray(group.items)) {
    const links: Obj[] = [];
    out.items = group.items.map((item) => {
      if (!isObj(item)) return item;
      if (typeof item.href === 'string' && item.href.trim() !== '') {
        links.push({ id: item.id, skill: item.label, url: item.href });
      }
      return item.label;
    });
    if (links.length > 0 && out.links === undefined) out.links = links;
  }
  return out;
}

/** `{ title, org, summary, skillsDeveloped }` → `{ degree, institution, details, skills }`. */
function upgradeEducation(entry: Obj): Obj {
  if ('institution' in entry) return entry;
  const { title, org, summary, skillsDeveloped, ...out } = entry;
  out.institution = org;
  if (title !== undefined) out.degree = title;
  if (summary !== undefined && out.details === undefined) {
    out.details = typeof summary === 'string' ? [summary] : summary;
  }
  if (skillsDeveloped !== undefined && out.skills === undefined) out.skills = skillsDeveloped;
  return out;
}

/** `{ title, href, stack }` → `{ name, url, tech }`. */
function upgradeProject(entry: Obj): Obj {
  if ('name' in entry) return entry;
  const { title, href, stack, ...out } = entry;
  out.name = title;
  if (href !== undefined && out.url === undefined) out.url = href;
  if (stack !== undefined && out.tech === undefined) out.tech = stack;
  return out;
}

/** `skillsDeveloped` → `skills`. */
function upgradeExperience(entry: Obj): Obj {
  const { skillsDeveloped, ...out } = entry;
  if (skillsDeveloped !== undefined && out.skills === undefined) out.skills = skillsDeveloped;
  return out;
}
