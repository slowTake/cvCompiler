import { DEFAULT_TEMPLATE_ID } from '../templates/registry';
import { newId } from './id';
import {
  CV_SCHEMA_VERSION,
  SECTION_IDS,
  type ContactItem,
  type ContactKind,
  type CvDocument,
  type EducationEntry,
  type ExperienceEntry,
  type LanguageEntry,
  type LinkItem,
  type ProjectEntry,
  type SectionConfig,
  type SectionId,
  type SkillGroup,
  type SkillLink,
} from './types';

export const SECTION_LABELS: Record<SectionId, string> = {
  about: 'About',
  skills: 'Skills',
  experience: 'Experience',
  projects: 'Projects',
  education: 'Education',
  languages: 'Languages',
};

export const CONTACT_KIND_LABELS: Record<ContactKind, string> = {
  email: 'Email',
  phone: 'Phone',
  location: 'Location',
  website: 'Website',
  linkedin: 'LinkedIn',
  github: 'GitHub',
  other: 'Other',
};

export const DEFAULT_SECTION_ORDER: readonly SectionId[] = [
  'about',
  'experience',
  'projects',
  'skills',
  'education',
  'languages',
];

export function defaultSections(): SectionConfig[] {
  return DEFAULT_SECTION_ORDER.map((id) => ({ id, visible: true }));
}

export function sectionTitle(config: SectionConfig): string {
  return config.title?.trim() || SECTION_LABELS[config.id];
}

export function isSectionId(value: unknown): value is SectionId {
  return typeof value === 'string' && (SECTION_IDS as readonly string[]).includes(value);
}

export function emptyDocument(): CvDocument {
  return {
    version: CV_SCHEMA_VERSION,
    meta: { title: 'Untitled CV', templateId: DEFAULT_TEMPLATE_ID, sections: defaultSections() },
    identity: { name: '', contact: [] },
    skills: [],
    education: [],
    projects: [],
    experience: [],
    languages: [],
  };
}

export const newContact = (): ContactItem => ({ id: newId(), kind: 'email', value: '' });
export const newLink = (): LinkItem => ({ id: newId(), url: '' });
export const newSkillLink = (): SkillLink => ({ id: newId(), skill: '', url: '' });
export const newSkillGroup = (): SkillGroup => ({ id: newId(), name: '', items: [] });
export const newEducation = (): EducationEntry => ({ id: newId(), institution: '' });
export const newProject = (): ProjectEntry => ({ id: newId(), name: '' });
export const newExperience = (): ExperienceEntry => ({ id: newId(), title: '', org: '', bullets: [] });
export const newLanguage = (): LanguageEntry => ({ id: newId(), name: '' });
