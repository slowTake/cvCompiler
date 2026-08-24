import { DEFAULT_TEMPLATE_ID } from '@/types/cv'
import type { CvTemplate } from '@/templates/types'

/**
 * Built-in templates. Each is a precomposed (LayoutSkeleton × Theme).
 * Adding a template that reuses an existing skeleton is data-only — a new
 * registry entry + a `[data-cv-theme]` block in index.css, no component code.
 * `Slate` demonstrates exactly that: same `sidebar` skeleton as `Studio`.
 */
export const TEMPLATE_REGISTRY: CvTemplate[] = [
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
    description: 'The Studio layout in a cool, neutral slate palette',
    skeletonId: 'sidebar',
    themeId: 'slate',
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
