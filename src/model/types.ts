/**
 * The CV document schema. See docs/DATA-MODEL.md for the written reference.
 *
 * Everything beyond the "core" fields of each entry is optional plain text.
 * `id` fields exist for stable list editing; files without them are accepted
 * and get fresh ids on import.
 */

export const CV_SCHEMA_VERSION = 2;

export const SECTION_IDS = [
  'about',
  'skills',
  'experience',
  'projects',
  'education',
  'languages',
] as const;
export type SectionId = (typeof SECTION_IDS)[number];

export const SECTION_SPACINGS = ['tight', 'normal', 'roomy'] as const;
export type SectionSpacing = (typeof SECTION_SPACINGS)[number];

export interface SectionConfig {
  id: SectionId;
  visible: boolean;
  /** Optional custom heading; falls back to the default label. */
  title?: string;
  /** Space between the section's items. Absent means 'normal'. */
  spacing?: Exclude<SectionSpacing, 'normal'>;
  /**
   * Sidebar skeletons only: true puts the section in the side column, false in
   * the main one. Absent means the skeleton's default (see templates/skeletons.ts).
   */
  sidebar?: boolean;
}

export const FONT_PAIRINGS = ['mono', 'sans', 'serif', 'editorial', 'technical'] as const;
export type FontPairing = (typeof FONT_PAIRINGS)[number];

export const DENSITIES = ['compact', 'normal', 'roomy'] as const;
export type Density = (typeof DENSITIES)[number];

export const HEADER_CASES = ['upper', 'normal'] as const;
export type HeaderCase = (typeof HEADER_CASES)[number];

export const SIDEBAR_WIDTH_RANGE = { min: 30, max: 50 } as const;
export const TYPE_SCALE_RANGE = { min: 80, max: 145 } as const;

/** User style overrides. A missing field means "use the template default". */
export interface StyleOverrides {
  /** `#rrggbb` */
  accent?: string;
  fontPairing?: FontPairing;
  density?: Density;
  headerCase?: HeaderCase;
  /** Percent of the page width, 30–50. Sidebar skeleton only. */
  sidebarWidth?: number;
  /** Percent, 80–145. */
  typeScale?: number;
}

export interface CvMeta {
  title: string;
  templateId: string;
  style?: StyleOverrides;
  sections: SectionConfig[];
  /** Ids of entries (any list, contacts and links too) this version leaves out. */
  excluded?: string[];
}

/** An extra version of the CV: same content, its own design and selection. */
export interface CvVersion {
  id: string;
  name: string;
  meta: CvMeta;
}

export const CONTACT_KINDS = [
  'email',
  'phone',
  'location',
  'website',
  'linkedin',
  'github',
  'other',
] as const;
export type ContactKind = (typeof CONTACT_KINDS)[number];

export interface ContactItem {
  id: string;
  kind: ContactKind;
  value: string;
  /** Optional explicit link target; otherwise derived from kind + value. */
  href?: string;
}

export interface LinkItem {
  id: string;
  url: string;
  label?: string;
}

export interface Identity {
  name: string;
  role?: string;
  about?: string;
  contact: ContactItem[];
  links?: LinkItem[];
}

export interface SkillGroup {
  id: string;
  name: string;
  items: string[];
}

export interface EducationEntry {
  id: string;
  institution: string;
  degree?: string;
  start?: string;
  end?: string;
  location?: string;
  details?: string[];
}

export interface ProjectEntry {
  id: string;
  name: string;
  role?: string;
  start?: string;
  end?: string;
  url?: string;
  /** Paragraphs and "- " bullet lines, in any mix (see model/description.ts). */
  description?: string;
  tech?: string[];
}

export interface ExperienceEntry {
  id: string;
  title: string;
  org: string;
  start?: string;
  end?: string;
  location?: string;
  /** Paragraphs and "- " bullet lines, in any mix (see model/description.ts). */
  description?: string;
  /** "Skills developed" in this role. */
  skills?: string[];
}

export interface LanguageEntry {
  id: string;
  name: string;
  level?: string;
}

export interface CvDocument {
  version: typeof CV_SCHEMA_VERSION;
  meta: CvMeta;
  identity: Identity;
  skills: SkillGroup[];
  education: EducationEntry[];
  projects: ProjectEntry[];
  experience: ExperienceEntry[];
  languages: LanguageEntry[];
  /** Versions beyond the original, whose meta is `meta`. See model/versions.ts. */
  versions?: CvVersion[];
}

export type ListSectionKey = 'skills' | 'education' | 'projects' | 'experience' | 'languages';
