import { describe, expect, it } from 'vitest';
import demo from '../data/cv.public.json';
import { normalizeCv, parseCvJson, serializeCv, type ParseResult } from '../src/model/normalize';
import { SECTION_IDS, type CvDocument } from '../src/model/types';

const minimal = () => ({ identity: { name: 'Ada Example' } });

function expectOk(result: ParseResult): Extract<ParseResult, { ok: true }> {
  if (!result.ok) throw new Error(`expected ok, got errors: ${JSON.stringify(result.errors)}`);
  return result;
}

function expectErrors(result: ParseResult): string[] {
  if (result.ok) throw new Error('expected errors, got a document');
  return result.errors.map((e) => `${e.path} ${e.message}`);
}

describe('parseCvJson', () => {
  it('reports invalid JSON with the parser message', () => {
    const errors = expectErrors(parseCvJson('{ "identity": '));
    expect(errors).toHaveLength(1);
    expect(errors[0]).toMatch(/^\(file\) is not valid JSON: /);
  });

  it('rejects a non-object root', () => {
    expect(expectErrors(parseCvJson('[1, 2]'))).toEqual(['(root) must be a JSON object, got an array']);
    expect(expectErrors(parseCvJson('"cv"'))).toEqual(['(root) must be a JSON object, got string']);
  });

  it('parses the shipped demo CV without dropping anything', () => {
    const { doc, dropped } = expectOk(parseCvJson(JSON.stringify(demo)));
    expect(dropped).toEqual([]);
    expect(doc.identity.name).toBe('Mira Lindqvist');
    expect(doc.meta.templateId).toBe('studio');
    expect(doc.experience.length).toBeGreaterThan(0);
  });

  it('round-trips: serialising and re-parsing gives the same document', () => {
    const { doc } = expectOk(parseCvJson(JSON.stringify(demo)));
    const again = expectOk(parseCvJson(serializeCv(doc)));
    expect(again.doc).toEqual(doc);
    expect(again.dropped).toEqual([]);
  });
});

describe('normalizeCv: structural errors', () => {
  it('requires identity with a name', () => {
    expect(expectErrors(normalizeCv({}))).toContain('identity is required');
    expect(expectErrors(normalizeCv({ identity: 'Ada' }))).toContain('identity must be an object, got string');
    expect(expectErrors(normalizeCv({ identity: {} }))).toContain('identity.name is required');
    expect(expectErrors(normalizeCv({ identity: { name: false } }))).toContain(
      'identity.name must be text, got boolean',
    );
  });

  it('requires list sections to be lists of objects', () => {
    const errors = expectErrors(
      normalizeCv({ ...minimal(), experience: { title: 'x' }, skills: ['React'] }),
    );
    expect(errors).toContain('experience must be a list, got an object');
    expect(errors).toContain('skills[0] must be an object, got string');
  });

  it('requires the core fields of each entry and names the exact path', () => {
    const errors = expectErrors(
      normalizeCv({
        ...minimal(),
        experience: [{ title: 'Engineer', org: 'Acme' }, { org: 'Acme' }],
        education: [{ degree: 'BSc' }],
        languages: [{ level: 'Fluent' }],
        identity: { name: 'Ada', contact: [{ kind: 'email' }] },
      }),
    );
    expect(errors).toEqual(
      expect.arrayContaining([
        'experience[1].title is required',
        'education[0].institution is required',
        'languages[0].name is required',
        'identity.contact[0].value is required',
      ]),
    );
  });

  it('collects several errors instead of stopping at the first', () => {
    const errors = expectErrors(normalizeCv({ identity: {}, projects: 3, meta: [] }));
    expect(errors.length).toBeGreaterThanOrEqual(3);
  });

  it('rejects documents from a newer schema version', () => {
    expect(expectErrors(normalizeCv({ ...minimal(), version: 99 }))[0]).toMatch(/^version is 99/);
  });
});

describe('normalizeCv: lenient optional values', () => {
  it('fills defaults for a minimal document', () => {
    const { doc, dropped } = expectOk(normalizeCv(minimal()));
    expect(dropped).toEqual([]);
    expect(doc.meta.title).toBe('Ada Example');
    expect(doc.meta.templateId).toBe('studio');
    expect(doc.meta.style).toBeUndefined();
    expect(doc.meta.sections.map((s) => s.id).sort()).toEqual([...SECTION_IDS].sort());
    expect(doc.meta.sections.every((s) => s.visible)).toBe(true);
    expect(doc.identity.contact).toEqual([]);
    expect(doc.experience).toEqual([]);
  });

  it('quietly drops invalid optional values and records them', () => {
    const { doc, dropped } = expectOk(
      normalizeCv({
        identity: { name: 'Ada', role: { text: 'x' }, about: '   ' },
        experience: [
          {
            title: 'Engineer',
            org: 'Acme',
            start: 2020,
            location: ['Oslo'],
            bullets: ['Shipped it', 42, null, '', 'Fixed it'],
            skills: 'TypeScript',
          },
        ],
        meta: { templateId: 'no-such-template', style: { accent: 'pink', density: 'roomy', glow: true } },
      }),
    );
    expect(doc.identity.role).toBeUndefined();
    expect(doc.identity.about).toBeUndefined();
    expect(doc.meta.templateId).toBe('studio');
    expect(doc.meta.style).toEqual({ density: 'roomy' });

    const [job] = doc.experience;
    expect(job.start).toBe('2020');
    expect(job.location).toBeUndefined();
    expect(job.bullets).toEqual(['Shipped it', '42', 'Fixed it']);
    expect(job.skills).toEqual(['TypeScript']);

    const paths = dropped.map((d) => d.path);
    expect(paths).toEqual(
      expect.arrayContaining([
        'identity.role',
        'experience[0].location',
        'experience[0].bullets[2]',
        'meta.templateId',
        'meta.style.accent',
        'meta.style.glow',
      ]),
    );
  });

  it('does not keep keys for empty optional fields', () => {
    const { doc } = expectOk(
      normalizeCv({ ...minimal(), projects: [{ name: 'P', url: '', bullets: [], tech: [' '] }] }),
    );
    expect(Object.keys(doc.projects[0]).sort()).toEqual(['id', 'name']);
  });

  it('maps unknown contact kinds to "other"', () => {
    const { doc, dropped } = expectOk(
      normalizeCv({ identity: { name: 'Ada', contact: [{ kind: 'fax', value: '123' }] } }),
    );
    expect(doc.identity.contact[0].kind).toBe('other');
    expect(dropped.map((d) => d.path)).toContain('identity.contact[0].kind');
  });

  it('assigns ids that are missing or duplicated', () => {
    const { doc } = expectOk(
      normalizeCv({
        ...minimal(),
        languages: [{ name: 'A', id: 'same' }, { name: 'B', id: 'same' }, { name: 'C' }],
      }),
    );
    const ids = doc.languages.map((l) => l.id);
    expect(ids[0]).toBe('same');
    expect(new Set(ids).size).toBe(3);
    expect(ids.every((id) => typeof id === 'string' && id.length > 0)).toBe(true);
  });

  it('normalises the section list: unknown and duplicates dropped, missing appended hidden', () => {
    const { doc, dropped } = expectOk(
      normalizeCv({
        ...minimal(),
        meta: {
          sections: [
            'experience',
            { id: 'skills', visible: false, title: 'Toolbox' },
            { id: 'hobbies' },
            'experience',
            { id: 'about', visible: 'yes' },
          ],
        },
      }),
    );
    const sections = doc.meta.sections;
    expect(sections.slice(0, 3)).toEqual([
      { id: 'experience', visible: true },
      { id: 'skills', visible: false, title: 'Toolbox' },
      { id: 'about', visible: true },
    ]);
    expect(sections.slice(3).map((s) => s.visible)).toEqual([false, false, false]);
    expect(sections).toHaveLength(SECTION_IDS.length);
    expect(dropped.map((d) => d.path)).toEqual(
      expect.arrayContaining(['meta.sections[2]', 'meta.sections[3]', 'meta.sections[4].visible']),
    );
  });

  it('produces a document that satisfies the CvDocument shape', () => {
    const { doc } = expectOk(normalizeCv(minimal()));
    const typed: CvDocument = doc;
    expect(typed.version).toBe(1);
  });
});
