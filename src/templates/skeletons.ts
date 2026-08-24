import { SidebarSkeleton } from '@/components/preview/skeletons/SidebarSkeleton'
import type { LayoutSkeletonId, SkeletonComponent } from '@/templates/types'

/** Resolve a LayoutSkeletonId to its renderer. Add new skeletons here (Phase 5). */
export const SKELETONS: Record<LayoutSkeletonId, SkeletonComponent> = {
  sidebar: SidebarSkeleton,
}

export function getSkeleton(id: LayoutSkeletonId): SkeletonComponent {
  return SKELETONS[id] ?? SKELETONS.sidebar
}
