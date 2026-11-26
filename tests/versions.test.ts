import { describe, expect, it } from 'vitest';
import demo from '../data/cv.public.json';
import { normalizeCv, parseCvJson, serializeCv } from '../src/model/normalize';
import type { CvDocument } from '../src/model/types';
import {
  addVersion,
  editorView,
  fromEditorView,
  ORIGINAL_VERSION_ID,
  removeVersion,
  renameVersion,
  renderedVersion,
  toggleIncluded,
  versionTabs,
} from '../src/model/versions';

function demoDoc(): CvDocument {
  const result = normalizeCv(demo);
  if (!result.ok) throw new Error('demo should parse');
  return result.doc;
}

describe('versions', () => {
  it('a new version copies the active version, design and selection', () => {
    let doc = demoDoc();
    const job = doc.experience[0].id;
    doc = toggleIncluded(doc, ORIGINAL_VERSION_ID, job);
    const { doc: next, id } = addVersion(doc, ORIGINAL_VERSION_ID);
    expect(versionTabs(next).map((t) => t.name)).toEqual(['Original', 'Version 2']);
    expect(next.versions?.[0].meta).toEqual(doc.meta);
    expect(next.versions?.[0].meta).not.toBe(doc.meta);
    expect(renderedVersion(next, id).experience.some((e) => e.id === job)).toBe(false);
  });

  it('leaving an entry out of one version keeps it in the others', () => {
    const { doc: withV2, id } = addVersion(demoDoc(), ORIGINAL_VERSION_ID);
    const job = withV2.experience[0].id;
    const doc = toggleIncluded(withV2, id, job);
    expect(renderedVersion(doc, id).experience.map((e) => e.id)).not.toContain(job);
    expect(renderedVersion(doc, ORIGINAL_VERSION_ID).experience.map((e) => e.id)).toContain(job);
    // Toggling back removes the empty list.
    expect(toggleIncluded(doc, id, job).versions?.[0].meta.excluded).toBeUndefined();
  });

  it('design edits go to the active version, content edits are shared', () => {
    const { doc: base, id } = addVersion(demoDoc(), ORIGINAL_VERSION_ID);
    const view = editorView(base, id);
    const edited = fromEditorView(base, id, {
      ...view,
      meta: { ...view.meta, templateId: 'classic' },
      identity: { ...view.identity, name: 'Renamed' },
    });
    expect(edited.versions?.[0].meta.templateId).toBe('classic');
    expect(edited.meta.templateId).toBe(base.meta.templateId);
    expect(edited.identity.name).toBe('Renamed');
  });

  it('renders a plain CV without version data', () => {
    const { doc, id } = addVersion(demoDoc(), ORIGINAL_VERSION_ID);
    const shown = renderedVersion(toggleIncluded(doc, id, doc.identity.contact[0].id), id);
    expect(shown.versions).toBeUndefined();
    expect(shown.meta.excluded).toBeUndefined();
    expect(shown.identity.contact).toHaveLength(doc.identity.contact.length - 1);
  });

  it('renames and removes versions, never the original', () => {
    const { doc, id } = addVersion(demoDoc(), ORIGINAL_VERSION_ID);
    expect(versionTabs(renameVersion(doc, id, ' Consulting ')).map((t) => t.name)).toContain('Consulting');
    expect(renameVersion(doc, ORIGINAL_VERSION_ID, 'x')).toBe(doc);
    expect(removeVersion(doc, id).versions).toBeUndefined();
  });

  it('round-trips through the file format', () => {
    let { doc, id } = addVersion(demoDoc(), ORIGINAL_VERSION_ID);
    doc = toggleIncluded(renameVersion(doc, id, 'Short'), id, doc.projects[0].id);
    const again = parseCvJson(serializeCv(doc));
    if (!again.ok) throw new Error('should parse');
    expect(again.dropped).toEqual([]);
    expect(again.doc).toEqual(doc);
  });

  it('drops a broken version instead of rejecting the file', () => {
    const result = normalizeCv({ ...demo, versions: [{ name: 'No meta' }] });
    if (!result.ok) throw new Error('should parse');
    expect(result.doc.versions).toBeUndefined();
    expect(result.dropped.map((d) => d.path)).toEqual(['versions[0]']);
  });
});
