import type { ComponentType } from 'react'
import type { CvDocument } from '@/types/cv'

/**
 * Structural arrangement of a CV. A LayoutSkeleton owns structure only — colors,
 * fonts, and accents come from the Theme (the `--cv-*` token block).
 */
export type LayoutSkeletonId = 'sidebar' | 'single' | 'header-band'

/** Props every layout skeleton receives. Scale + theme are applied by the dispatcher wrapper. */
export type SkeletonProps = { cv: CvDocument }

/** Props for the top-level preview dispatcher (`CvPreview`). */
export type TemplatePreviewProps = {
  cv: CvDocument
  /** Multiplier for type/spacing density (1 = default). Affects print too. */
  scale?: number
}

/**
 * A precomposed, named template = a LayoutSkeleton × Theme.
 * `themeId` must have a matching `[data-cv-theme='<id>']` block in index.css
 * (see THEME_IDS in `@/templates/themes`).
 */
export type CvTemplate = {
  id: string
  label: string
  description?: string
  skeletonId: LayoutSkeletonId
  themeId: string
  /** Optional gallery thumbnail (Phase 4). */
  thumbnail?: string
}

export type SkeletonComponent = ComponentType<SkeletonProps>
