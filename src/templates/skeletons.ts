import { SidebarSkeleton } from '@/components/preview/skeletons/SidebarSkeleton'
import { SingleColumnSkeleton } from '@/components/preview/skeletons/SingleColumnSkeleton'
import { HeaderBandSkeleton } from '@/components/preview/skeletons/HeaderBandSkeleton'
import type { LayoutSkeletonId, SkeletonComponent } from '@/templates/types'

/** Resolve a LayoutSkeletonId to its renderer. Add new skeletons here (Phase 5). */
export const SKELETONS: Record<LayoutSkeletonId, SkeletonComponent> = {
  sidebar: SidebarSkeleton,
  single: SingleColumnSkeleton,
  'header-band': HeaderBandSkeleton,
}

export function getSkeleton(id: LayoutSkeletonId): SkeletonComponent {
  return SKELETONS[id] ?? SKELETONS.sidebar
}
