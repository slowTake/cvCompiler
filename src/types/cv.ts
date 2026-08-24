export type SectionId =
  | 'about'
  | 'skills'
  | 'education'
  | 'projects'
  | 'experience'
  | 'languages'

export type ContactItem = {
  id: string
  type: 'email' | 'phone' | 'location' | 'link'
  label: string
  value: string
  href?: string
  icon?: string
}

export type SkillItem = {
  id: string
  label: string
  href?: string
}

/** Optional social/portfolio link (Phase 3). Text-only; no binary data. */
export type LinkItem = {
  id: string
  label: string
  href: string
}

export type SkillGroup = {
  id: string
  title: string
  items: SkillItem[]
}

export type EducationItem = {
  id: string
  title: string
  org: string
  orgHref?: string
  start: string
  end: string
  location?: string
  summary?: string
  skillsDeveloped?: string[]
}

export type ProjectItem = {
  id: string
  title: string
  href?: string
  start?: string
  end?: string
  summary: string
  stack?: string[]
}

export type ExperienceItem = {
  id: string
  title: string
  org: string
  orgHref?: string
  start: string
  end: string
  location?: string
  skillsDeveloped?: string[]
  bullets: string[]
}

export type LanguageItem = {
  id: string
  name: string
  level: string
}

export type CvDocument = {
  meta: {
    title: string
    locale?: string
    updatedAt?: string
    /** Registry template id; default `studio`. */
    templateId?: string
  }
  identity: {
    name: string
    role: string
    /** Optional one-line summary, distinct from `about` (Phase 3). */
    tagline?: string
    contact: ContactItem[]
    /** Optional social/portfolio links row (Phase 3). */
    links?: LinkItem[]
    about: string
  }
  skills: SkillGroup[]
  education: EducationItem[]
  projects: ProjectItem[]
  experience: ExperienceItem[]
  languages: LanguageItem[]
  sectionOrder?: SectionId[]
  sectionsEnabled?: Partial<Record<SectionId, boolean>>
}

export const DEFAULT_TEMPLATE_ID = 'studio'

export const DEFAULT_SECTION_ORDER: SectionId[] = [
  'about',
  'skills',
  'education',
  'projects',
  'experience',
  'languages',
]

export function isSectionEnabled(cv: CvDocument, id: SectionId): boolean {
  return cv.sectionsEnabled?.[id] !== false
}

export function resolveTemplateId(cv: CvDocument): string {
  return cv.meta.templateId?.trim() || DEFAULT_TEMPLATE_ID
}
