import type { SectionId } from '../model/types';

export const SKELETON_IDS = ['sidebar', 'single', 'header-band'] as const;
export type SkeletonId = (typeof SKELETON_IDS)[number];

export interface SkeletonInfo {
  id: SkeletonId;
  name: string;
  description: string;
  /** Sections placed in the side column; everything else flows in the main column. */
  sidebarSections: readonly SectionId[];
  /** Whether the sidebarWidth override has any effect. */
  usesSidebarWidth: boolean;
}

export const SKELETONS: Record<SkeletonId, SkeletonInfo> = {
  sidebar: {
    id: 'sidebar',
    name: 'Sidebar',
    description: 'Name, contact, about and skills in a side column; the rest in the main column.',
    sidebarSections: ['about', 'skills'],
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
