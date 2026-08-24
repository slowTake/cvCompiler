import { useEffect, useId, useRef, useState } from 'react'
import { getTemplate, listTemplates } from '@/templates/registry'
import { TemplateThumb } from '@/components/preview/TemplateThumb'

type Props = {
  templateId: string
  onTemplateChange: (templateId: string) => void
}

/**
 * Template picker: a trigger button showing the current template, opening a
 * panel of themed thumbnail cards. The panel is a `radiogroup` with roving
 * tabindex + arrow-key navigation, so it is the accessible baseline on its own
 * (no separate <select> needed). Selection stores a flat templateId, unchanged.
 */
export function TemplateGallery({ templateId, onTemplateChange }: Props) {
  const templates = listTemplates()
  const current = getTemplate(templateId)
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const groupId = useId()

  useEffect(() => {
    if (!open) return
    function onPointer(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  function select(id: string) {
    onTemplateChange(id)
    setOpen(false)
  }

  function onCardKeyDown(e: React.KeyboardEvent, index: number) {
    const last = templates.length - 1
    let next = index
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = index === last ? 0 : index + 1
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = index === 0 ? last : index - 1
    else if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault()
      select(templates[index].id)
      return
    } else return
    e.preventDefault()
    const group = rootRef.current?.querySelector(`#${CSS.escape(groupId)}`)
    const cards = group?.querySelectorAll<HTMLButtonElement>('[role="radio"]')
    cards?.[next]?.focus()
    onTemplateChange(templates[next].id)
  }

  return (
    <div className="template-picker" ref={rootRef}>
      <span className="toolbar-select__label" id={`${groupId}-label`}>
        Template
      </span>
      <button
        type="button"
        className="template-picker__trigger"
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <TemplateThumb themeId={current.themeId} skeletonId={current.skeletonId} />
        <span className="template-picker__name">{current.label}</span>
        <span className="template-picker__chevron" aria-hidden="true">
          ▾
        </span>
      </button>

      {open ? (
        <div
          className="template-gallery"
          role="radiogroup"
          id={groupId}
          aria-labelledby={`${groupId}-label`}
        >
          {templates.map((t, index) => {
            const selected = t.id === current.id
            return (
              <button
                key={t.id}
                type="button"
                role="radio"
                aria-checked={selected}
                tabIndex={selected ? 0 : -1}
                className={`template-card${selected ? ' template-card--selected' : ''}`}
                onClick={() => select(t.id)}
                onKeyDown={(e) => onCardKeyDown(e, index)}
              >
                <TemplateThumb themeId={t.themeId} skeletonId={t.skeletonId} />
                <span className="template-card__label">{t.label}</span>
                {t.description ? (
                  <span className="template-card__desc">{t.description}</span>
                ) : null}
              </button>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}
