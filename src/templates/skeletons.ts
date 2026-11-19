import type { SectionConfig, SectionId } from '../model/types';

export const SKELETON_IDS = ['sidebar', 'single', 'header-band'] as const;
export type SkeletonId = (typeof SKELETON_IDS)[number];

export interface SkeletonInfo {
  id: SkeletonId;
  name: string;
  description: string;
  /** Sections placed in the side column by default; everything else flows in the main column. */
  sidebarSections: readonly SectionId[];
  /** Whether the sidebarWidth override has any effect. */
  usesSidebarWidth: boolean;
}

/** Whether a section sits in the side column of a skeleton that has one. */
export function isInSidebar(skeleton: SkeletonInfo, section: SectionConfig): boolean {
  if (skeleton.sidebarSections.length === 0) return false;
  return section.sidebar ?? skeleton.sidebarSections.includes(section.id);
}

/** Moves a section to the other column, saving nothing when it lands back on the default. */
export function toggleSidebar(skeleton: SkeletonInfo, section: SectionConfig): SectionConfig {
  const { sidebar: _old, ...rest } = section;
  const next = !isInSidebar(skeleton, section);
  return next === skeleton.sidebarSections.includes(section.id) ? rest : { ...rest, sidebar: next };
}

export const SKELETONS: Record<SkeletonId, SkeletonInfo> = {
  sidebar: {
    id: 'sidebar',
    name: 'Sidebar',
    description: 'Name, contact, about, skills and languages in a side column; the rest in the main column.',
    sidebarSections: ['about', 'skills', 'languages'],
    usesSidebarWidth: true,
  },
  single: {
    id: 'single',
    name: 'Single column',
    description: 'One column, top to bottom. Plays well with applicant tracking systems.',
    sidebarSections: [],
    usesSidebarWidth: false,
  },
  'header-band': {
    id: 'header-band',
    name: 'Header band',
    description: 'A coloured band with your name and contact over a single-column body.',
    sidebarSections: [],
    usesSidebarWidth: false,
  },
};
