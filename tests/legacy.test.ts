import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import demo from '../data/cv.public.json';
import { isLegacyCv, LEGACY_TEMPLATE_IDS, upgradeLegacyCv } from '../src/model/legacy';
import { contactHref } from '../src/model/links';
import { normalizeCv, parseCvJson, type ParseResult } from '../src/model/normalize';
import type { CvDocument } from '../src/model/types';
import { loadCachedDocument } from '../src/persistence/cache';
import { CvSection, IdentityBlock } from '../src/preview/parts';
import { hasTemplate } from '../src/templates/registry';

/** data/cv.public.json as saved by the first cvStudio, commit 094fa69. */
const fixtureText = readFileSync(join(__dirname, 'fixtures/legacy-094fa69.json'), 'utf8');
const legacy = () => JSON.parse(fixtureText) as Record<string, unknown>;

function expectOk(result: ParseResult): Extract<ParseResult, { ok: true }> {
  if (!result.ok) throw new Error(`expected ok, got errors: ${JSON.stringify(result.errors)}`);
  return result;
}

/** Every string, number and boolean in a JSON value, with its path. `id` keys are skipped. */
function leaves(value: unknown, path = ''): { path: string; value: string }[] {
  if (Array.isArray(value)) return value.flatMap((v, i) => leaves(v, `${path}[${i}]`));
  if (typeof value === 'object' && value !== null) {
    return Object.entries(value).flatMap(([k, v]) =>
      k === 'id' ? [] : leaves(v, path ? `${path}.${k}` : k),
    );
  }
  return [{ path, value: String(value) }];
}

describe('files from the first cvStudio (094fa69)', () => {
  it('opens the old demo CV without dropping anything', () => {
    const { doc, dropped } = expectOk(parseCvJson(fixtureText));
    expect(dropped).toEqual([]);
    expect(doc.version).toBe(1);
    expect(doc.identity.name).toBe('Avery Quinn');
    expect(doc.meta).toEqual({
      title: 'Software Developer',
      templateId: 'studio',
      sections: ['about', 'skills', 'education', 'projects', 'experience', 'languages'].map((id) => ({
        id,
        visible: true,
      })),
    });
  });

  it('keeps every value of the old file', () => {
    const old = legacy();
    const { doc } = expectOk(normalizeCv(old));
    const kept = new Set(leaves(doc).map((l) => l.value));
    const missing = leaves(old).filter((l) => !kept.has(l.value));

    // What is not carried over, and why:
    expect(missing.map((l) => l.path)).toEqual([
      'meta.locale', // bookkeeping the current app does not use
      'meta.updatedAt',
      'identity.contact[0].href', // derived again from kind + value, checked below
      'identity.contact[0].icon', // only repeated the type
      'identity.contact[1].href',
      'identity.contact[2].icon',
      'identity.contact[3].type', // "link", now kind "github"
      'identity.contact[3].href',
      'identity.contact[4].type', // "link", now kind "website"
      'identity.contact[4].href',
      'identity.contact[4].icon',
      // Now meta.sections[].id (ids are skipped here); order checked above.
      ...[0, 1, 2, 3, 4, 5].map((i) => `sectionOrder[${i}]`),
    ]);

    const oldContact = (old.identity as { contact: { href?: string }[] }).contact;
    doc.identity.contact.forEach((c, i) => expect(contactHref(c)).toBe(oldContact[i].href));
  });

  it('maps every field to its new name', () => {
    const { doc } = expectOk(normalizeCv(legacy()));
    expect(doc.identity.contact.map((c) => [c.kind, c.label, c.value])).toEqual([
      ['email', 'Email', 'avery.quinn@example.com'],
      ['phone', 'Phone', '+1 (555) 010-2048'],
      ['location', 'Location', 'Portland, OR'],
      ['github', 'GitHub', 'github.com/avery-quinn-demo'],
      ['website', 'Website', 'averyquinn.dev'],
    ]);
    expect(doc.skills[1]).toEqual({
      id: 'tools',
      name: 'Tools',
      items: ['TypeScript', 'React', 'Node.js', 'PostgreSQL', 'Vite', 'Git'],
    });
    expect(doc.education[0]).toEqual({
      id: 'edu1',
      institution: 'Cascade Technical University',
      degree: 'B.S. Computer Science',
      orgHref: 'https://example.com/ctu',
      start: '2016',
      end: '2020',
      location: 'Eugene, OR',
      details: ['Focus on distributed systems and human-computer interaction.'],
      skills: ['Algorithms', 'Systems design', 'UX research methods'],
    });
    expect(doc.projects[0]).toMatchObject({
      name: 'Harbor Board',
      url: 'https://example.com/harbor-board',
      tech: ['React', 'IndexedDB', 'CRDT sync'],
    });
    expect(doc.experience[0]).toMatchObject({
      title: 'Senior Software Engineer',
      org: 'Northwind Labs',
      orgHref: 'https://example.com/northwind',
      skills: ['Design systems', 'Performance profiling', 'Team facilitation'],
    });
  });

  it('keeps per-skill links, taglines and identity links', () => {
    const old = legacy();
    Object.assign(old.identity as object, {
      tagline: 'Calm, maintainable products',
      links: [{ id: 'l1', label: 'Blog', href: 'https://blog.example.com' }],
    });
    (old.skills as { items: unknown[] }[])[1].items[1] = { id: 't2', label: 'React', href: 'https://react.dev' };
    const { doc, dropped } = expectOk(normalizeCv(old));
    expect(dropped).toEqual([]);
    expect(doc.identity.tagline).toBe('Calm, maintainable products');
    expect(doc.identity.links).toEqual([{ id: 'l1', url: 'https://blog.example.com', label: 'Blog' }]);
    expect(doc.skills[1].items[1]).toBe('React');
    expect(doc.skills[1].links).toEqual([{ id: 't2', skill: 'React', url: 'https://react.dev' }]);
  });

  it('turns sectionOrder and sectionsEnabled into meta.sections', () => {
    const old = { ...legacy(), sectionOrder: ['experience', 'about'], sectionsEnabled: { about: false } };
    const { doc } = expectOk(normalizeCv(old));
    expect(doc.meta.sections).toEqual([
      { id: 'experience', visible: true },
      { id: 'about', visible: false },
      // Not in sectionOrder, so the old app did not show them.
      { id: 'skills', visible: false },
      { id: 'projects', visible: false },
      { id: 'education', visible: false },
      { id: 'languages', visible: false },
    ]);
  });

  it('maps link contacts by host', () => {
    const kindOf = (contact: object) => {
      const { doc } = expectOk(normalizeCv({ ...legacy(), identity: { name: 'A', contact: [contact] } }));
      return doc.identity.contact[0].kind;
    };
    expect(kindOf({ type: 'link', label: 'In', value: 'linkedin.com/in/a' })).toBe('linkedin');
    expect(kindOf({ type: 'link', label: 'In', value: 'me', href: 'https://www.linkedin.com/in/a' })).toBe('linkedin');
    expect(kindOf({ type: 'link', label: 'Code', value: 'https://github.com/a' })).toBe('github');
    expect(kindOf({ type: 'link', label: 'Home', value: 'a.dev' })).toBe('website');
    expect(kindOf({ type: 'link', label: 'Fake', value: 'notgithub.com/a' })).toBe('website');
  });

  it('keeps a contact href the app would not derive', () => {
    const contact = { type: 'link', label: 'Portfolio', value: 'My work', href: 'https://a.dev/work' };
    const { doc } = expectOk(normalizeCv({ ...legacy(), identity: { name: 'A', contact: [contact] } }));
    expect(doc.identity.contact[0]).toMatchObject({ kind: 'website', href: 'https://a.dev/work', label: 'Portfolio' });
  });

  it('maps every old template id to a current template', () => {
    const oldIds = ['studio', 'slate', 'noir', 'forest', 'rose', 'ats', 'classic', 'azure', 'modern', 'bold'];
    for (const id of oldIds) {
      const { doc, dropped } = expectOk(normalizeCv({ ...legacy(), meta: { title: 'T', templateId: id } }));
      expect(dropped).toEqual([]);
      expect(doc.meta.templateId).toBe(LEGACY_TEMPLATE_IDS[id] ?? id);
    }
    expect(Object.values(LEGACY_TEMPLATE_IDS).every(hasTemplate)).toBe(true);
  });

  it('leaves current-format files alone, with or without version', () => {
    const { version: _version, ...unversioned } = demo;
    expect(isLegacyCv(unversioned)).toBe(false);
    expect(upgradeLegacyCv(unversioned)).toBe(unversioned);
    expect(isLegacyCv({ ...legacy(), version: 1 })).toBe(false);
    // A versioned file with an old template id is not upgraded.
    const { dropped } = expectOk(normalizeCv({ ...demo, meta: { ...demo.meta, templateId: 'noir' } }));
    expect(dropped.map((d) => d.path)).toEqual(['meta.templateId']);
  });

  it('still reports bad values, under their new paths', () => {
    const old = legacy();
    (old.education as Record<string, unknown>[])[0].org = { bad: true };
    expect(normalizeCv(old)).toEqual({
      ok: false,
      errors: [{ path: 'education[0].institution', message: 'must be text, got an object' }],
    });
  });
});

describe('preview of the restored fields', () => {
  const doc = (): CvDocument => {
    const old = legacy();
    Object.assign(old.identity as object, { tagline: 'Calm, maintainable products' });
    (old.identity as { contact: object[] }).contact.push({ type: 'phone', label: 'Mobile', value: '+1 555 0100' });
    (old.skills as { items: unknown[] }[])[1].items[1] = { id: 't2', label: 'React', href: 'https://react.dev' };
    return expectOk(normalizeCv(old)).doc;
  };
  const section = (d: CvDocument, id: string) =>
    renderToStaticMarkup(createElement(CvSection, { doc: d, config: { id: id as 'about', visible: true } }));

  it('shows the tagline and only labels that add something', () => {
    const html = renderToStaticMarkup(createElement(IdentityBlock, { identity: doc().identity }));
    expect(html).toContain('<p class="cv-tagline">Calm, maintainable products</p>');
    expect(html).toContain('<span class="cv-contact-label">Mobile</span>');
    expect(html).not.toContain('cv-contact-label">Email');
    expect(html).toContain('href="https://github.com/avery-quinn-demo"');
  });

  it('links organisations, skills and shows education skills', () => {
    const d = doc();
    expect(section(d, 'experience')).toContain('href="https://example.com/northwind"');
    expect(section(d, 'skills')).toContain('href="https://react.dev"');
    const education = section(d, 'education');
    expect(education).toContain('href="https://example.com/ctu"');
    expect(education).toContain('Systems design');
  });
});

describe('legacy browser cache', () => {
  let store: Map<string, string>;
  beforeEach(() => {
    store = new Map();
    vi.stubGlobal('localStorage', {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => void store.set(k, v),
      removeItem: (k: string) => void store.delete(k),
    });
  });
  afterEach(() => vi.unstubAllGlobals());

  it('reads the old cache when the new one is empty', () => {
    store.set('cvstudio:cv', fixtureText);
    const cached = loadCachedDocument();
    expect(cached?.doc.identity.name).toBe('Avery Quinn');
    expect(cached?.clean).toBe(false);
    expect(store.has('cvstudio:cv')).toBe(true);
  });

  it('prefers the new cache', () => {
    store.set('cvstudio:cv', fixtureText);
    store.set('cvstudio.document.v1', JSON.stringify({ clean: true, doc: demo }));
    expect(loadCachedDocument()?.doc.identity.name).toBe('Mira Lindqvist');
  });

  it('skips unreadable old entries', () => {
    store.set('cvstudio:cv', '{ not json');
    store.set('cvstudio:demo', fixtureText);
    expect(loadCachedDocument()?.doc.identity.name).toBe('Avery Quinn');
  });

  it('returns nothing when no cache exists', () => {
    expect(loadCachedDocument()).toBeUndefined();
  });
});
