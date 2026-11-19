import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { sectionTitle } from '../model/defaults';
import type { EditTarget } from '../model/editTarget';
import type { CvDocument, ListSectionKey, SectionId } from '../model/types';
import { loadUiState, saveUiState } from '../persistence/cache';
import { getTemplate } from '../templates/registry';
import { SKELETONS } from '../templates/skeletons';
import { EditFocusContext, focusWithin } from './editFocus';
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
  /** Latest click on the preview; the form opens and focuses what was clicked. */
  editTarget?: EditTarget | null;
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

  const reveal = useCallback((id: string, scroll = true) => {
    setOpen((current) => (current.has(id) ? current : new Set(current).add(id)));
    // Wait for the section body to render before scrolling.
    if (!scroll) return;
    requestAnimationFrame(() =>
      document.getElementById(formSectionDomId(id))?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
    );
  }, []);

  return { open, toggle, reveal };
}

type ListSectionId = Exclude<SectionId, 'about'>;

/**
 * Opens the section a preview click points at. Entries are expanded and
 * focused by their EntryList; section-level fields (Identity's name, about)
 * are focused here.
 */
function useEditTarget(
  editTarget: EditTarget | null | undefined,
  open: ReadonlySet<string>,
  reveal: (id: string, scroll?: boolean) => void,
) {
  const [pending, setPending] = useState<EditTarget | null>(null);
  useEffect(() => {
    if (!editTarget) return;
    setPending(editTarget);
    reveal(editTarget.section, !editTarget.entryId && !editTarget.field);
  }, [editTarget, reveal]);
  // Section-level fields, once the section body has rendered.
  useEffect(() => {
    if (!pending || pending.entryId || !open.has(pending.section)) return;
    setPending(null);
    const section = document.getElementById(formSectionDomId(pending.section));
    if (section && pending.field) focusWithin(section, pending.field);
  }, [pending, open]);
  const done = useCallback(() => setPending(null), []);
  return useMemo(() => ({ target: pending, done }), [pending, done]);
}

export function Editor({ doc, update, editTarget }: Props) {
  const { open, toggle, reveal } = useOpenSections();
  const editFocus = useEditTarget(editTarget, open, reveal);
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
    <EditFocusContext.Provider value={editFocus}>
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
            skeleton={skeleton}
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
    </EditFocusContext.Provider>
  );
}
