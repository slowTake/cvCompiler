import type { CSSProperties } from 'react'
import type { CvDocument } from '@/types/cv'
import { resolveTemplateId } from '@/types/cv'
import { getTemplate } from '@/templates/registry'
import { getSkeleton } from '@/templates/skeletons'

/**
 * Preview dispatcher. Resolves the active template (skeleton × theme) from
 * `cv.meta.templateId`, applies theme + skeleton hooks and the scale token on
 * the preview root, and renders the resolved LayoutSkeleton.
 */
export function CvPreview({
  cv,
  scale = 1,
}: {
  cv: CvDocument
  /** Multiplier for type/spacing density (1 = default). Affects print too. */
  scale?: number
}) {
  const template = getTemplate(resolveTemplateId(cv))
  const Skeleton = getSkeleton(template.skeletonId)

  return (
    <div
      className="cv-preview-stack"
      data-cv-theme={template.themeId}
      data-cv-skeleton={template.skeletonId}
      style={{ '--cv-scale': String(scale) } as CSSProperties}
    >
      <Skeleton cv={cv} />
    </div>
  )
}
