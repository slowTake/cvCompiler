import { useEffect, useRef, useState } from 'react'
import type { CvDocument } from '@/types/cv'
import { resolveTemplateId } from '@/types/cv'
import { listTemplates } from '@/templates/registry'
import type { LayoutSkeletonId } from '@/templates/types'
import { hasDesignOverrides } from '@/templates/style'
import { CvPreview } from '@/components/preview/CvPreview'

type Props = {
  open: boolean
  cv: CvDocument
  onClose: () => void
  onSelect: (templateId: string) => void
}

type Filter = 'all' | LayoutSkeletonId

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'sidebar', label: 'Two-column' },
  { id: 'single', label: 'Single-column · ATS-safe' },
  { id: 'header-band', label: 'Header band' },
]

/**
 * TemplateGallery: a modal grid showing the user's own CV rendered live in
 * every template (first page, scaled down), with their style overrides applied.
 * Built on <dialog> for focus trapping, Escape and the backdrop.
 */
export function TemplateGallery({ open, cv, onClose, onSelect }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [filter, setFilter] = useState<Filter>('all')
  const currentId = resolveTemplateId(cv)
  const templates = listTemplates().filter(
    (t) => filter === 'all' || t.skeletonId === filter,
  )

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (open && !dialog.open) {
      dialog.showModal()
      dialog
        .querySelector<HTMLButtonElement>('.gallery-card--current')
        ?.focus()
    } else if (!open && dialog.open) {
      dialog.close()
    }
  }, [open])

  return (
    <dialog
      ref={dialogRef}
      className="gallery-dialog no-print"
      aria-labelledby="gallery-title"
      onClose={onClose}
      onClick={(e) => {
        // A click on the backdrop lands on the <dialog> element itself.
        if (e.target === e.currentTarget) onClose()
      }}
    >
      {open ? (
        <div className="gallery">
          <header className="gallery__head">
            <div>
              <h2 id="gallery-title" className="gallery__title">
                Choose a template
              </h2>
              <p className="gallery__sub">
                Previewing your CV.{' '}
                {hasDesignOverrides(cv.meta.style)
                  ? 'Your Design tweaks carry over; reset them in the Design tab.'
                  : 'Fine-tune colours and fonts afterwards in the Design tab.'}
              </p>
            </div>
            <button
              type="button"
              className="btn btn--ghost gallery__close"
              onClick={onClose}
              aria-label="Close template gallery"
            >
              ✕
            </button>
          </header>

          <div className="gallery__filters" role="group" aria-label="Filter templates">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                aria-pressed={filter === f.id}
                className={`gallery__filter${filter === f.id ? ' gallery__filter--active' : ''}`}
                onClick={() => setFilter(f.id)}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="gallery__grid">
            {templates.map((t) => {
              const current = t.id === currentId
              return (
                <button
                  key={t.id}
                  type="button"
                  aria-current={current ? 'true' : undefined}
                  className={`gallery-card${current ? ' gallery-card--current' : ''}`}
                  onClick={() => {
                    onSelect(t.id)
                    onClose()
                  }}
                >
                  <span className="gallery-card__frame" inert>
                    <CvPreview cv={cv} templateId={t.id} className="cv-preview-stack--mini" />
                  </span>
                  <span className="gallery-card__meta">
                    <span className="gallery-card__label">
                      {t.label}
                      {current ? <span className="gallery-card__badge">Current</span> : null}
                    </span>
                    {t.description ? (
                      <span className="gallery-card__desc">{t.description}</span>
                    ) : null}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      ) : null}
    </dialog>
  )
}
