import { useId, type ReactNode } from 'react'
import type { CvDocument, CvStyle } from '@/types/cv'
import { resolveTemplateId } from '@/types/cv'
import { getTemplate } from '@/templates/registry'
import {
  ACCENT_MIN_CONTRAST,
  ACCENT_PRESETS,
  DENSITIES,
  FONT_PAIRINGS,
  FONT_STACKS,
  HEADER_CASES,
  SIDEBAR_WIDTH_DEFAULT,
  SIDEBAR_WIDTH_MAX,
  SIDEBAR_WIDTH_MIN,
  TYPE_SCALE_DEFAULT,
  TYPE_SCALE_MAX,
  TYPE_SCALE_MIN,
  contrastRatio,
  hasDesignOverrides,
} from '@/templates/style'
import { TemplateThumb } from '@/components/preview/TemplateThumb'

type Props = {
  cv: CvDocument
  onStyleChange: (patch: Partial<CvStyle>) => void
  onReset: () => void
  onOpenGallery: () => void
}

function DesignGroup({
  title,
  hint,
  children,
}: {
  title: string
  hint?: ReactNode
  children: ReactNode
}) {
  const id = useId()
  return (
    <section className="design-group" aria-labelledby={id}>
      <h3 className="design-group__title" id={id}>
        {title}
      </h3>
      {children}
      {hint ? <p className="design-group__hint">{hint}</p> : null}
    </section>
  )
}

/** Single-choice row of buttons. `undefined` value = "Template" (no override). */
function Segmented<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string
  options: { id: T | undefined; label: string }[]
  value: T | undefined
  onChange: (value: T | undefined) => void
}) {
  return (
    <div className="segmented" role="radiogroup" aria-label={label}>
      {options.map((option) => (
        <button
          key={option.id ?? 'template'}
          type="button"
          role="radio"
          aria-checked={value === option.id}
          className={`segmented__option${value === option.id ? ' segmented__option--active' : ''}`}
          onClick={() => onChange(option.id)}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

/**
 * Design tab (ADR 0007): StyleOverrides layered over the active template.
 * Every control has a "template default" state that clears its override, so
 * switching templates later still shows that template's own look.
 */
export function DesignPanel({ cv, onStyleChange, onReset, onOpenGallery }: Props) {
  const template = getTemplate(resolveTemplateId(cv))
  const style = cv.meta.style ?? {}
  const typeScale = style.typeScale ?? TYPE_SCALE_DEFAULT
  const sidebarWidth = style.sidebarWidth ?? SIDEBAR_WIDTH_DEFAULT
  const lowContrast =
    style.accent !== undefined &&
    contrastRatio(style.accent, '#ffffff') < ACCENT_MIN_CONTRAST

  return (
    <div className="design-panel">
      <DesignGroup title="Template">
        <div className="design-template">
          <TemplateThumb themeId={template.themeId} skeletonId={template.skeletonId} />
          <div className="design-template__text">
            <strong>{template.label}</strong>
            {template.description ? <span>{template.description}</span> : null}
          </div>
          <button type="button" className="btn" onClick={onOpenGallery}>
            Change
          </button>
        </div>
      </DesignGroup>

      <DesignGroup
        title="Accent colour"
        hint={
          lowContrast ? (
            <span className="design-warning" role="status">
              This colour is light, so icons, links and rules may be hard to read on
              a pale page. Try a darker shade.
            </span>
          ) : (
            'Icons, links, rules and header bands follow this colour.'
          )
        }
      >
        <div className="swatches" role="radiogroup" aria-label="Accent colour">
          <button
            type="button"
            role="radio"
            aria-checked={style.accent === undefined}
            className={`swatch swatch--template${style.accent === undefined ? ' swatch--active' : ''}`}
            data-cv-theme={template.themeId}
            title={`${template.label} default`}
            onClick={() => onStyleChange({ accent: undefined })}
          >
            <span className="visually-hidden">{template.label} default</span>
          </button>
          {ACCENT_PRESETS.map((hex) => (
            <button
              key={hex}
              type="button"
              role="radio"
              aria-checked={style.accent === hex}
              className={`swatch${style.accent === hex ? ' swatch--active' : ''}`}
              style={{ background: hex }}
              title={hex}
              onClick={() => onStyleChange({ accent: hex })}
            >
              <span className="visually-hidden">{hex}</span>
            </button>
          ))}
          <label
            className={`swatch swatch--custom${
              style.accent && !ACCENT_PRESETS.includes(style.accent) ? ' swatch--active' : ''
            }`}
            title="Custom colour"
            style={
              style.accent && !ACCENT_PRESETS.includes(style.accent)
                ? { background: style.accent }
                : undefined
            }
          >
            <span className="visually-hidden">Custom colour</span>
            <input
              type="color"
              value={style.accent ?? '#d47a96'}
              onChange={(e) => onStyleChange({ accent: e.target.value })}
            />
          </label>
        </div>
      </DesignGroup>

      <DesignGroup title="Fonts">
        <div className="font-cards" role="radiogroup" aria-label="Font pairing">
          <button
            type="button"
            role="radio"
            aria-checked={style.fontPairing === undefined}
            className={`font-card${style.fontPairing === undefined ? ' font-card--active' : ''}`}
            data-cv-theme={template.themeId}
            onClick={() => onStyleChange({ fontPairing: undefined })}
          >
            <span className="font-card__sample" style={{ fontFamily: 'var(--cv-font-heading)' }}>
              Aa
            </span>
            <span className="font-card__label">Template</span>
          </button>
          {FONT_PAIRINGS.map((pairing) => {
            const sample = FONT_STACKS[pairing.id]
            const active = style.fontPairing === pairing.id
            return (
              <button
                key={pairing.id}
                type="button"
                role="radio"
                aria-checked={active}
                title={pairing.hint}
                className={`font-card${active ? ' font-card--active' : ''}`}
                data-cv-theme={template.themeId}
                onClick={() => onStyleChange({ fontPairing: pairing.id })}
              >
                <span
                  className="font-card__sample"
                  style={{ fontFamily: `var(--cv-stack-${sample.heading})` }}
                >
                  Aa
                </span>
                <span
                  className="font-card__label"
                  style={{ fontFamily: `var(--cv-stack-${sample.body})` }}
                >
                  {pairing.label}
                </span>
              </button>
            )
          })}
        </div>
      </DesignGroup>

      <DesignGroup title="Spacing">
        <Segmented
          label="Spacing"
          options={DENSITIES.map((d) => ({
            id: d.id === 'normal' ? undefined : d.id,
            label: d.label,
          }))}
          value={style.density}
          onChange={(density) => onStyleChange({ density })}
        />
      </DesignGroup>

      <DesignGroup title="Section headings">
        <Segmented
          label="Section heading case"
          options={[
            { id: undefined, label: 'Template' },
            ...HEADER_CASES.map((h) => ({ id: h.id, label: h.label })),
          ]}
          value={style.headerCase}
          onChange={(headerCase) => onStyleChange({ headerCase })}
        />
      </DesignGroup>

      {template.skeletonId === 'sidebar' ? (
        <DesignGroup title="Sidebar width">
          <RangeRow
            label="Sidebar width percent"
            min={SIDEBAR_WIDTH_MIN}
            max={SIDEBAR_WIDTH_MAX}
            value={sidebarWidth}
            defaultValue={SIDEBAR_WIDTH_DEFAULT}
            onChange={(value) =>
              onStyleChange({
                sidebarWidth: value === SIDEBAR_WIDTH_DEFAULT ? undefined : value,
              })
            }
          />
        </DesignGroup>
      ) : null}

      <DesignGroup
        title="Type size"
        hint="Shrink to fit more on a page, or grow for readability. Prints as shown."
      >
        <RangeRow
          label="Type size percent"
          min={TYPE_SCALE_MIN}
          max={TYPE_SCALE_MAX}
          value={typeScale}
          defaultValue={TYPE_SCALE_DEFAULT}
          onChange={(value) => onStyleChange({ typeScale: value })}
        />
      </DesignGroup>

      <div className="design-panel__footer">
        <button
          type="button"
          className="btn btn--ghost"
          disabled={!hasDesignOverrides(cv.meta.style)}
          onClick={onReset}
        >
          Reset to {template.label} defaults
        </button>
      </div>
    </div>
  )
}

function RangeRow({
  label,
  min,
  max,
  value,
  defaultValue,
  onChange,
}: {
  label: string
  min: number
  max: number
  value: number
  defaultValue: number
  onChange: (value: number) => void
}) {
  return (
    <div className="range-row">
      <input
        type="range"
        min={min}
        max={max}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label={label}
      />
      <span className="range-row__value">{value}%</span>
      <button
        type="button"
        className="btn btn--ghost range-row__reset"
        disabled={value === defaultValue}
        onClick={() => onChange(defaultValue)}
      >
        Reset
      </button>
    </div>
  )
}
