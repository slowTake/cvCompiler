/**
 * PDF import against real browser output: tests/fixtures/pdf holds what
 * pdf.js extracts from the demo CV printed in every template by Firefox and
 * by Chromium (regenerate with `npm run e2e:pdf -- --fixtures`), plus two of
 * the PDFs themselves.
 */
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { serializeCv } from '../src/model/normalize';
import type { PdfContent } from '../src/pdf/content';
import { EMBED_PREFIX, isEmbedUrl, visibleOnly } from '../src/pdf/embed';
import { PdfReadError } from '../src/pdf/errors';
import { importPdfContent } from '../src/pdf/importPdf';
import { parseDateRange, parsePdfContent } from '../src/pdf/parse';
import { demoDocument } from '../src/persistence/initialData';
import { readPdfNode } from './helpers/nodePdf';
import { scoreParse } from './helpers/scoreParse';

const dir = path.join(__dirname, 'fixtures/pdf');
/** The demo CV in each template; external-*.json is a CV typeset elsewhere (e2e/external-cv.html). */
const fixtures = readdirSync(dir).filter((f) => f.endsWith('.json') && !f.startsWith('external-'));
const load = (f: string): PdfContent => JSON.parse(readFileSync(path.join(dir, f), 'utf8'));
const templateOf = (f: string) => f.replace(/^\w+-/, '').replace('.json', '');

function expectedFor(template: string) {
  const doc = demoDocument();
  doc.meta.templateId = template;
  return doc;
}

describe('embedded data', () => {
  it.each(fixtures)('%s restores exactly', async (f) => {
    const result = await importPdfContent(load(f));
    expect(result.kind).toBe('embedded');
    if (result.kind !== 'embedded') return;
    expect(serializeCv(result.doc)).toBe(serializeCv(visibleOnly(expectedFor(templateOf(f)))));
    expect(result.modified).toBe(false);
  });

  it('flags a PDF whose text was edited after export', async () => {
    const content = load('chromium-studio.json');
    const item = content.pages[0].items.find((i) => i.str === 'Kettle & Kite Labs')!;
    item.str = 'Globex Corporation International';
    const result = await importPdfContent(content);
    expect(result.kind === 'embedded' && result.modified).toBe(true);
  });

  it.each(['chromium-studio.pdf', 'firefox-studio.pdf'])('reads %s end to end', async (f) => {
    const content = await readPdfNode(new Uint8Array(readFileSync(path.join(dir, f))));
    const result = await importPdfContent(content);
    expect(result.kind).toBe('embedded');
    if (result.kind === 'embedded') expect(serializeCv(result.doc)).toBe(serializeCv(demoDocument()));
  });
});

describe('text-parsing fallback', () => {
  it.each(fixtures)('%s recovers the CV and its template', (f) => {
    const parsed = parsePdfContent(load(f));
    const score = scoreParse(parsed, visibleOnly(expectedFor(templateOf(f))));
    expect(score.misses).toEqual([]);
    expect(parsed.doc.meta.templateId).toBe(templateOf(f));
  });

  it('is used when the embedded data is damaged', async () => {
    const content = load('firefox-classic.json');
    for (const link of content.pages[0].links) {
      if (isEmbedUrl(link.url)) link.url = link.url.slice(0, EMBED_PREFIX.length + 40) + link.url.slice(EMBED_PREFIX.length + 50);
    }
    const result = await importPdfContent(content);
    expect(result.kind).toBe('parsed');
    expect(result.kind === 'parsed' && result.damagedEmbed).toBe(true);
  });

  it('keeps text under unknown headings instead of dropping it', () => {
    const content = load('chromium-classic.json');
    const heading = content.pages[1].items.find((i) => /L\s*A\s*N\s*G/.test(i.str))!;
    heading.str = 'VOLUNTEERING';
    const parsed = parsePdfContent(content);
    expect(parsed.unplaced.some((u) => u.heading === 'VOLUNTEERING' && /Swedish/.test(u.text))).toBe(true);
    expect(parsed.doc.languages).toEqual([]);
  });

  it('says so when a PDF has no text to read', async () => {
    const empty: PdfContent = { pages: [{ width: 595, height: 842, items: [], links: [] }] };
    await expect(importPdfContent(empty)).rejects.toBeInstanceOf(PdfReadError);
  });
});

describe('a CV typeset elsewhere', () => {
  it.each(['external-firefox.json', 'external-chromium.json'])('%s goes to review with sensible guesses', async (f) => {
    const result = await importPdfContent(load(f));
    expect(result.kind).toBe('parsed');
    if (result.kind !== 'parsed') return;
    const { doc, flags, unplaced } = result.result;
    expect(doc.identity.name).toBe('Jordan Example');
    // One link on the contact row must not make every contact a LinkedIn link.
    expect(doc.identity.contact.map((c) => c.kind)).toEqual(['email', 'phone', 'location', 'linkedin']);
    expect(doc.meta.sections.find((s) => s.id === 'about')?.title).toBe('Professional summary');
    // "Company – Title" is turned round, and says so.
    expect(doc.experience.map((e) => [e.title, e.org, e.start, e.end])).toEqual([
      ['Senior Backend Engineer', 'Acme Logistics Inc', 'Jan 2021', 'Present'],
      ['Software Engineer', 'Brightline Data', 'Jun 2017', 'Dec 2020'],
    ]);
    expect(flags.filter((x) => x.section === 'experience' && x.field === 'title')).toHaveLength(2);
    // List bullets drawn as shapes still come back as bullet points.
    expect(doc.experience[0].description).toBe(
      '- Designed an event pipeline handling 40M messages a day.\n- Cut p99 latency of the routing API by 60%.',
    );
    expect(doc.education[0]).toMatchObject({ institution: 'Oregon State University', degree: 'BSc Computer Science' });
    expect(doc.skills.map((g) => g.name)).toEqual(['Languages', 'Infrastructure']);
    expect(unplaced.map((u) => u.heading)).toEqual(['VOLUNTEERING']);
  });
});

describe('parseDateRange', () => {
  it.each([
    ['2019 – 2022', { start: '2019', end: '2022' }],
    ['2022 - present', { start: '2022', end: 'Present' }],
    ['Mar 2021 – Jun 2023', { start: 'Mar 2021', end: 'Jun 2023' }],
    ['2026-09 – Present', { start: '2026-09', end: 'Present' }],
    ['09/2020 to 05/2022', { start: '09/2020', end: '05/2022' }],
    ['2019  2022', { start: '2019', end: '2022' }],
    ['2023', { start: '2023', end: undefined }],
  ])('%s', (text, want) => {
    expect(parseDateRange(text)).toEqual(want);
  });

  it('ignores other text', () => {
    expect(parseDateRange('Gothenburg, Sweden')).toBeNull();
    expect(parseDateRange('3,000 weekly users')).toBeNull();
  });
});
