import type { CvDocument } from '@/types/cv'
import { resolveTemplateId } from '@/types/cv'
import { getTemplate } from '@/templates/registry'
import { getSkeleton } from '@/templates/skeletons'
import { styleToPreviewProps } from '@/templates/style'

/**
 * Preview dispatcher. Resolves the active template (skeleton × theme) from
 * `cv.meta.templateId`, applies theme + skeleton hooks and the document's style
 * overrides (`meta.style`, ADR 0007) as `--cv-*` tokens on the preview root, and
 * renders the resolved LayoutSkeleton.
 */
export function CvPreview({
  cv,
  templateId,
  className,
}: {
  cv: CvDocument
  /** Render with this template instead of `cv.meta.templateId` (gallery previews). */
  templateId?: string
  className?: string
}) {
  const template = getTemplate(templateId ?? resolveTemplateId(cv))
  const Skeleton = getSkeleton(template.skeletonId)
  const { style, attrs } = styleToPreviewProps(cv.meta.style)

  return (
    <div
      className={className ? `cv-preview-stack ${className}` : 'cv-preview-stack'}
      data-cv-theme={template.themeId}
      data-cv-skeleton={template.skeletonId}
      {...attrs}
      style={style}
    >
      <Skeleton cv={cv} />
    </div>
  )
}
