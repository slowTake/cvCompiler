import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { sectionTitle } from '../model/defaults';
import type { CvDocument, ListSectionKey, SectionId } from '../model/types';
import { loadUiState, saveUiState } from '../persistence/cache';
import { getTemplate } from '../templates/registry';
import { SKELETONS } from '../templates/skeletons';
import { formSectionDomId } from './FormSection';
import { DesignSection } from './sections/DesignSection';
import { EducationSection } from './sections/EducationSection';
import { ExperienceSection } from './sections/ExperienceSection';
import { IdentitySection } from './sections/IdentitySection';
import { LanguagesSection } from './sections/LanguagesSection';
import { LayoutSection } from './sections/LayoutSection';
import { ProjectsSection } from './sections/ProjectsSection';
import { SkillsSection } from './sections/SkillsSection';

interface Props {
  doc: CvDocument;
  /** Functional updates, so late callbacks (e.g. Undo) only touch their own slice. */
  update: (fn: (doc: CvDocument) => CvDocument) => void;
}

const OPEN_KEY = 'openSections';
const DEFAULT_OPEN = ['identity', 'experience'];

function useOpenSections() {
  const [open, setOpen] = useState<ReadonlySet<string>>(
    () => new Set(loadUiState<string[]>(OPEN_KEY, DEFAULT_OPEN)),
  );
  useEffect(() => saveUiState(OPEN_KEY, [...open]), [open]);

  const toggle = useCallback((id: string) => {
    setOpen((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const reveal = useCallback((id: string) => {
    setOpen((current) => (current.has(id) ? current : new Set(current).add(id)));
    // Wait for the section body to render before scrolling.
    requestAnimationFrame(() =>
      document.getElementById(formSectionDomId(id))?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
    );
  }, []);

  return { open, toggle, reveal };
}

type ListSectionId = Exclude<SectionId, 'about'>;

export function Editor({ doc, update }: Props) {
  const { open, toggle, reveal } = useOpenSections();
  const skeleton = SKELETONS[getTemplate(doc.meta.templateId).skeleton];
  const chrome = (id: string) => ({ open: open.has(id), onToggle: toggle });
  const setList =
    <K extends ListSectionKey>(key: K) =>
    (value: CvDocument[K]) =>
      update((d) => ({ ...d, [key]: value }));

  const listSections: Record<ListSectionId, (title: string) => ReactNode> = {
    skills: (title) => (
      <SkillsSection key="skills" title={title} value={doc.skills} onChange={setList('skills')} {...chrome('skills')} />
    ),
    experience: (title) => (
      <ExperienceSection
        key="experience"
        title={title}
        value={doc.experience}
        onChange={setList('experience')}
        {...chrome('experience')}
      />
    ),
    projects: (title) => (
      <ProjectsSection
        key="projects"
        title={title}
        value={doc.projects}
        onChange={setList('projects')}
        {...chrome('projects')}
      />
    ),
    education: (title) => (
      <EducationSection
        key="education"
        title={title}
        value={doc.education}
        onChange={setList('education')}
        {...chrome('education')}
      />
    ),
    languages: (title) => (
      <LanguagesSection
        key="languages"
        title={title}
        value={doc.languages}
        onChange={setList('languages')}
        {...chrome('languages')}
      />
    ),
  };

  // The form follows the CV's own section order. About lives in Identity.
  const ordered = doc.meta.sections.filter(
    (s): s is typeof s & { id: ListSectionId } => s.id !== 'about',
  );
  const nav: { id: string; label: string }[] = [
    { id: 'design', label: 'Design' },
    { id: 'layout', label: 'Sections' },
    { id: 'identity', label: 'Identity' },
    ...ordered.map((s) => ({ id: s.id, label: sectionTitle(s) })),
  ];

  return (
    <div className="ui-editor">
      <nav className="ui-jump-nav" aria-label="Jump to section">
        {nav.map((n) => (
          <button
            key={n.id}
            type="button"
            className={open.has(n.id) ? 'is-open' : ''}
            onClick={() => reveal(n.id)}
          >
            {n.label}
          </button>
        ))}
      </nav>
      <div className="ui-form">
        <DesignSection doc={doc} onChange={(meta) => update((d) => ({ ...d, meta }))} {...chrome('design')} />
        <LayoutSection
          value={doc.meta}
          sidebarSections={skeleton.sidebarSections}
          onChange={(meta) => update((d) => ({ ...d, meta }))}
          {...chrome('layout')}
        />
        <IdentitySection
          value={doc.identity}
          onChange={(identity) => update((d) => ({ ...d, identity }))}
          {...chrome('identity')}
        />
        {ordered.map((s) => listSections[s.id](sectionTitle(s)))}
      </div>
    </div>
  );
}
