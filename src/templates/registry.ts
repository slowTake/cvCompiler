import { CvPreview } from '@/components/preview/CvPreview'
import { DEFAULT_TEMPLATE_ID } from '@/types/cv'
import type { CvTemplate } from '@/templates/types'

/** Built-in templates. Add new layouts here as registry entries. */
export const TEMPLATE_REGISTRY: CvTemplate[] = [
  {
    id: DEFAULT_TEMPLATE_ID,
    label: 'Studio',
    description: 'Monospace two-column layout with soft pink accents',
    Preview: CvPreview,
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
