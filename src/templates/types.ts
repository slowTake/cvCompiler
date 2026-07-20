import type { ComponentType } from 'react'
import type { CvDocument } from '@/types/cv'

export type TemplatePreviewProps = {
  cv: CvDocument
  /** Multiplier for type/spacing density (1 = default). Affects print too. */
  scale?: number
}

export type CvTemplate = {
  id: string
  label: string
  description?: string
  Preview: ComponentType<TemplatePreviewProps>
}
