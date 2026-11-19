/**
 * How much of a known CV the text-parsing fallback recovered: one point per
 * field that matches after whitespace and bold markers are normalised.
 */
import { sectionTitle } from '../../src/model/defaults';
import type { CvDocument, SectionConfig } from '../../src/model/types';
import { getTemplate } from '../../src/templates/registry';
import { isInSidebar, SKELETONS } from '../../src/templates/skeletons';
import type { ParsedCv } from '../../src/pdf/parse';

const norm = (v: unknown) =>
  (Array.isArray(v) ? v.join('|') : String(v ?? ''))
    .replace(/\*\*/g, '')
    .replace(/\s+/g, ' ')
    .trim();

/**
 * Only these kinds show in the text itself; a website, GitHub or LinkedIn
 * link without its domain in it is told apart by an icon the PDF doesn't keep.
 */
const textKind = (kind: string) => (['email', 'phone', 'location'].includes(kind) ? kind : 'link');

export interface ParseScore {
  ratio: number;
  pass: boolean;
  misses: string[];
}

export function scoreParse(parsed: ParsedCv, expected: CvDocument, threshold = 0.95): ParseScore {
  const got = parsed.doc;
  let total = 0;
  const misses: string[] = [];
  const check = (label: string, want: unknown, have: unknown) => {
    if (norm(want) === '' && norm(have) === '') return;
    total++;
    if (norm(want) !== norm(have)) misses.push(`${label}: want "${norm(want).slice(0, 50)}" got "${norm(have).slice(0, 50)}"`);
  };

  check('name', expected.identity.name, got.identity.name);
  check('role', expected.identity.role, got.identity.role);
  check('about', expected.identity.about, got.identity.about);
  for (const c of expected.identity.contact) {
    const match = got.identity.contact.find((g) => norm(g.value) === norm(c.value));
    check(`contact ${c.kind}`, `${textKind(c.kind)}:${c.value}`, match ? `${textKind(match.kind)}:${match.value}` : '');
  }
  // A labelled link may come back as a link, or as a contact of a kind its URL gives away (LinkedIn).
  for (const l of expected.identity.links ?? []) {
    const link = (got.identity.links ?? []).find((g) => g.url === l.url);
    const contact = got.identity.contact.find((c) => c.href === l.url);
    const found = link ? `${link.label}:${link.url}` : contact ? `${contact.value}:${contact.href}` : '';
    check('link', `${l.label}:${l.url}`, found);
  }

  // Order across the two columns of a sidebar layout isn't visible on the page; order within each is.
  const visible = expected.meta.sections.filter((s) => s.visible);
  const skeleton = SKELETONS[getTemplate(expected.meta.templateId).skeleton];
  const column = (list: SectionConfig[], side: boolean) =>
    list.filter((s) => s.visible && isInSidebar(skeleton, s) === side).map((s) => s.id);
  check('section order (main)', column(expected.meta.sections, false), column(got.meta.sections, false));
  if (skeleton.id === 'sidebar') {
    check('section order (side)', column(expected.meta.sections, true), column(got.meta.sections, true));
  }
  for (const s of visible) {
    const g = got.meta.sections.find((x) => x.id === s.id);
    check(`heading ${s.id}`, sectionTitle(s), g ? sectionTitle(g) : '');
  }

  expected.skills.forEach((s, i) => {
    check(`skills[${i}].name`, s.name, got.skills[i]?.name);
    check(`skills[${i}].items`, s.items, got.skills[i]?.items);
  });
  expected.languages.forEach((l, i) => {
    check(`languages[${i}]`, `${l.name}/${l.level ?? ''}`, got.languages[i] && `${got.languages[i].name}/${got.languages[i].level ?? ''}`);
  });
  expected.experience.forEach((e, i) => {
    const g = got.experience[i];
    check(`experience[${i}].title`, e.title, g?.title);
    check(`experience[${i}].org`, e.org, g?.org);
    check(`experience[${i}].dates`, `${e.start}-${e.end}`, g && `${g.start}-${g.end}`);
    check(`experience[${i}].location`, e.location, g?.location);
    check(`experience[${i}].description`, e.description, g?.description);
    check(`experience[${i}].skills`, e.skills, g?.skills);
  });
  expected.projects.forEach((p, i) => {
    const g = got.projects[i];
    check(`projects[${i}].name`, p.name, g?.name);
    check(`projects[${i}].role`, p.role, g?.role);
    check(`projects[${i}].url`, p.url, g?.url);
    check(`projects[${i}].dates`, `${p.start}-${p.end}`, g && `${g.start}-${g.end}`);
    check(`projects[${i}].description`, p.description, g?.description);
    check(`projects[${i}].tech`, p.tech, g?.tech);
  });
  expected.education.forEach((e, i) => {
    const g = got.education[i];
    check(`education[${i}].degree`, e.degree, g?.degree);
    check(`education[${i}].institution`, e.institution, g?.institution);
    check(`education[${i}].dates`, `${e.start}-${e.end}`, g && `${g.start}-${g.end}`);
    check(`education[${i}].location`, e.location, g?.location);
    check(`education[${i}].details`, e.details, g?.details);
  });

  const ratio = total ? (total - misses.length) / total : 1;
  return { ratio, pass: ratio >= threshold, misses };
}
