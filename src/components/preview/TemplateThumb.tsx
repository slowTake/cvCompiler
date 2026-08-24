import type { LayoutSkeletonId } from '@/templates/types'

/**
 * Schematic, themed thumbnail for the template gallery. Renders a tiny
 * skeleton silhouette filled with the theme's `--cv-*` tokens (via the
 * `data-cv-theme` host), so it always matches the live theme — never a stale
 * pre-rendered image. Decorative only; the gallery card carries the label + a11y.
 */
export function TemplateThumb({
  themeId,
  skeletonId,
}: {
  themeId: string
  skeletonId: LayoutSkeletonId
}) {
  return (
    <div
      className={`template-thumb template-thumb--${skeletonId}`}
      data-cv-theme={themeId}
      aria-hidden="true"
    >
      <div className="template-thumb__sidebar">
        <span className="template-thumb__name" />
        <span className="template-thumb__line" />
        <span className="template-thumb__line template-thumb__line--short" />
        <span className="template-thumb__accent" />
        <span className="template-thumb__line" />
        <span className="template-thumb__line" />
      </div>
      <div className="template-thumb__main">
        <span className="template-thumb__accent" />
        <span className="template-thumb__line" />
        <span className="template-thumb__line" />
        <span className="template-thumb__line template-thumb__line--short" />
        <span className="template-thumb__accent" />
        <span className="template-thumb__line" />
        <span className="template-thumb__line template-thumb__line--short" />
      </div>
    </div>
  )
}
