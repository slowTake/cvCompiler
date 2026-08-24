import { DEFAULT_TEMPLATE_ID } from '@/types/cv'
import type { CvTemplate } from '@/templates/types'

/**
 * Built-in templates. Each is a precomposed (LayoutSkeleton × Theme).
 * Adding a template that reuses an existing skeleton is data-only — a new
 * registry entry + a `[data-cv-theme]` block in index.css, no component code.
 */
export const TEMPLATE_REGISTRY: CvTemplate[] = [
  // Sidebar skeleton
  {
    id: DEFAULT_TEMPLATE_ID,
    label: 'Studio',
    description: 'Monospace two-column layout with soft pink accents',
    skeletonId: 'sidebar',
    themeId: 'studio',
  },
  {
    id: 'slate',
    label: 'Slate',
    description: 'Two-column layout in a cool, neutral slate palette',
    skeletonId: 'sidebar',
    themeId: 'slate',
  },
  {
    id: 'noir',
    label: 'Noir',
    description: 'Stark monospace two-column, black on white',
    skeletonId: 'sidebar',
    themeId: 'noir',
  },
  {
    id: 'forest',
    label: 'Forest',
    description: 'Serif two-column with muted green accents',
    skeletonId: 'sidebar',
    themeId: 'forest',
  },
  {
    id: 'rose',
    label: 'Rose',
    description: 'Warm sans-serif two-column in rose and burgundy',
    skeletonId: 'sidebar',
    themeId: 'rose',
  },

  // Single-column skeleton (ATS-friendly)
  {
    id: 'ats',
    label: 'ATS',
    description: 'Single-column, ATS-friendly plain layout',
    skeletonId: 'single',
    themeId: 'plain',
  },
  {
    id: 'classic',
    label: 'Classic',
    description: 'Traditional single-column serif résumé',
    skeletonId: 'single',
    themeId: 'classic',
  },
  {
    id: 'azure',
    label: 'Azure',
    description: 'Clean single-column sans-serif with blue accents',
    skeletonId: 'single',
    themeId: 'azure',
  },

  // Header-band skeleton
  {
    id: 'modern',
    label: 'Modern',
    description: 'Teal header band over a single-column body',
    skeletonId: 'header-band',
    themeId: 'modern',
  },
  {
    id: 'bold',
    label: 'Bold',
    description: 'Dark header band with amber accents',
    skeletonId: 'header-band',
    themeId: 'bold',
  },
]

export function getTemplate(id: string | undefined): CvTemplate {
  const resolved = id?.trim() || DEFAULT_TEMPLATE_ID
  return (
    TEMPLATE_REGISTRY.find((t) => t.id === resolved) ?? TEMPLATE_REGISTRY[0]
  )
}

export function listTemplates(): CvTemplate[] {
  return TEMPLATE_REGISTRY
}
