import { describe, expect, it } from 'vitest';
import { moveEntry, placeText, removeEntry, swapTitle } from '../src/pdf/reviewOps';
import { demoDocument } from '../src/persistence/initialData';

describe('review quick fixes', () => {
  it('moves an experience entry to projects, keeping its content', () => {
    const doc = demoDocument();
    const job = doc.experience[0];
    const next = moveEntry(doc, 'experience', job.id, 'projects');
    expect(next.experience.some((e) => e.id === job.id)).toBe(false);
    expect(next.projects.at(-1)).toEqual({
      id: job.id,
      name: job.title,
      role: job.org,
      start: job.start,
      end: job.end,
      description: job.description,
      tech: job.skills,
    });
  });

  it('moves into a hidden section and shows it', () => {
    const doc = demoDocument();
    doc.meta.sections = doc.meta.sections.map((s) => (s.id === 'education' ? { ...s, visible: false } : s));
    const next = moveEntry(doc, 'projects', doc.projects[0].id, 'education');
    expect(next.meta.sections.find((s) => s.id === 'education')?.visible).toBe(true);
    expect(next.education.at(-1)?.institution).toBe(doc.projects[0].role);
  });

  it('swaps title and organisation', () => {
    const doc = demoDocument();
    const job = doc.experience[1];
    const next = swapTitle(doc, 'experience', job.id);
    expect(next.experience[1]).toMatchObject({ title: job.org, org: job.title });
    expect(swapTitle(next, 'experience', job.id).experience[1]).toEqual(job);
  });

  it('removes an entry', () => {
    const doc = demoDocument();
    expect(removeEntry(doc, 'languages', doc.languages[0].id).languages).toHaveLength(doc.languages.length - 1);
  });

  it('places leftover text on About or as a bullet', () => {
    const doc = demoDocument();
    expect(placeText(doc, 'Extra line.', { kind: 'about' }).identity.about).toMatch(/\n\nExtra line\.$/);
    const job = doc.experience[0];
    const next = placeText(doc, 'Shipped it.', { kind: 'entry', section: 'experience', id: job.id });
    expect(next.experience[0].description).toBe(`${job.description}\n- Shipped it.`);
    const school = doc.education[0];
    const edu = placeText(doc, 'Dean’s list', { kind: 'entry', section: 'education', id: school.id });
    expect(edu.education[0].details?.at(-1)).toBe('Dean’s list');
  });
});
