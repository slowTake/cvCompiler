import { describe, expect, it } from 'vitest';
import { serializeCv } from '../src/model/normalize';
import { collapseLetterSpacing } from '../src/pdf/content';
import { decodeEmbed, EMBED_PREFIX, encodeEmbed, textDiffers, visibleOnly } from '../src/pdf/embed';
import { demoDocument } from '../src/persistence/initialData';

function shownText(): string {
  const d = demoDocument();
  return JSON.stringify(d.identity) + JSON.stringify(d.experience) + JSON.stringify(d.projects) +
    JSON.stringify(d.skills) + JSON.stringify(d.education) + JSON.stringify(d.languages);
}

describe('embed payload', () => {
  it('round-trips the document', async () => {
    const doc = demoDocument();
    const url = await encodeEmbed(doc);
    expect(url.startsWith(EMBED_PREFIX)).toBe(true);
    expect(serializeCv((await decodeEmbed(url))!)).toBe(serializeCv(doc));
  });

  it('stays compact', async () => {
    // The demo CV is ~7 KB of JSON; both engines keep links of at least 9 KB.
    expect((await encodeEmbed(demoDocument())).length).toBeLessThan(5000);
  });

  it('leaves hidden sections out but keeps their settings', async () => {
    const doc = demoDocument();
    doc.meta.sections = doc.meta.sections.map((s) =>
      s.id === 'projects' || s.id === 'about' ? { ...s, visible: false } : s,
    );
    const restored = (await decodeEmbed(await encodeEmbed(doc)))!;
    expect(restored.projects).toEqual([]);
    expect(restored.identity.about).toBeUndefined();
    expect(restored.experience).toEqual(doc.experience);
    expect(restored.meta.sections.find((s) => s.id === 'projects')?.visible).toBe(false);
    expect(visibleOnly(doc).projects).toEqual([]);
  });

  it('rejects damaged or foreign links', async () => {
    const url = await encodeEmbed(demoDocument());
    const cut = url.slice(0, -20);
    const flipped = url.slice(0, -10) + (url.at(-10) === 'A' ? 'B' : 'A') + url.slice(-9);
    expect(await decodeEmbed(cut)).toBeNull();
    expect(await decodeEmbed(flipped)).toBeNull();
    expect(await decodeEmbed('https://example.com/')).toBeNull();
    expect(await decodeEmbed(`${EMBED_PREFIX}not-base64!`)).toBeNull();
  });
});

describe('textDiffers', () => {
  it('accepts the document as rendered', () => {
    expect(textDiffers(demoDocument(), `${shownText()} EXPERIENCE Skills developed`)).toBe(false);
  });

  it('notices added words', () => {
    expect(textDiffers(demoDocument(), `${shownText()} Senior architect at Globex since forever`)).toBe(true);
  });

  it('notices removed content', () => {
    const text = shownText().replace(/Kettle & Kite Labs|collaborative planning tool used by/g, '');
    expect(textDiffers(demoDocument(), text)).toBe(true);
  });
});

describe('collapseLetterSpacing', () => {
  it.each([
    ['A B O U T', 'ABOUT'],
    ['E X P E R I E NC E', 'EXPERIENCE'],
    ['E DUC AT I ON', 'EDUCATION'],
    ['W O R K  H I S T O R Y', 'WORK HISTORY'],
    ['I am a', 'I am a'],
    ['Senior Product Engineer', 'Senior Product Engineer'],
    ['UX / UI', 'UX / UI'],
  ])('%s → %s', (input, output) => {
    expect(collapseLetterSpacing(input)).toBe(output);
  });
});
