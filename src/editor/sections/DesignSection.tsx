import { LayoutTemplate, Palette, RotateCcw, TriangleAlert } from 'lucide-react';
import { useId, useState, type ReactNode } from 'react';
import { contrastRatio, hexToRgb, MIN_ACCENT_CONTRAST, normalizeHex } from '../../model/color';
import { FONT_PAIRING_STACKS, resolveStyle, setOverride } from '../../model/style';
import {
  DENSITIES,
  FONT_PAIRINGS,
  HEADER_CASES,
  SIDEBAR_WIDTH_RANGE,
  TYPE_SCALE_RANGE,
  type CvDocument,
  type CvMeta,
  type StyleOverrides,
} from '../../model/types';
import { getTemplate } from '../../templates/registry';
import { SKELETONS } from '../../templates/skeletons';
import { FormSection, type SectionChrome } from '../FormSection';
import { TemplateGallery } from '../TemplateGallery';
import { usePageColor } from '../usePageColor';

interface Props extends SectionChrome {
  doc: CvDocument;
  onChange: (next: CvMeta) => void;
}

const DENSITY_LABELS = { compact: 'Compact', normal: 'Normal', roomy: 'Roomy' } as const;
const CASE_LABELS = { upper: 'UPPER', normal: 'Normal' } as const;

/** A knob row: label, control, and a reset button when it is overridden. */
function Knob({
  label,
  overridden,
  onReset,
  children,
  hint,
}: {
  label: string;
  overridden: boolean;
  onReset: () => void;
  children: (id: string) => ReactNode;
  hint?: ReactNode;
}) {
  const id = useId();
  return (
    <div className={`ui-knob${overridden ? ' is-overridden' : ''}`}>
      <div className="ui-knob-label">
        <label htmlFor={id}>{label}</label>
        {overridden ? (
          <button type="button" className="ui-link-btn" onClick={onReset} title="Back to the template default">
            <RotateCcw size={12} /> default
          </button>
        ) : (
          <span className="ui-knob-default">template default</span>
        )}
      </div>
      {children(id)}
      {hint && <p className="ui-hint">{hint}</p>}
    </div>
  );
}

function Segmented<T extends string>({
  id,
  options,
  value,
  labels,
  onChange,
}: {
  id: string;
  options: readonly T[];
  value: T;
  labels: Record<T, string>;
  onChange: (v: T) => void;
}) {
  return (
    <div className="ui-segmented" role="radiogroup" id={id}>
      {options.map((o) => (
        <button
          key={o}
          type="button"
          role="radio"
          aria-checked={value === o}
          className={value === o ? 'is-active' : ''}
          onClick={() => onChange(o)}
        >
          {labels[o]}
        </button>
      ))}
    </div>
  );
}

export function DesignSection({ doc, onChange, ...chrome }: Props) {
  const [galleryOpen, setGalleryOpen] = useState(false);
  const meta = doc.meta;
  const template = getTemplate(meta.templateId);
  const skeleton = SKELETONS[template.skeleton];
  const overrides = meta.style ?? {};
  const resolved = resolveStyle(template.defaults, meta.style);
  const pageColor = usePageColor(template, resolved);
  const [accentDraft, setAccentDraft] = useState<string | null>(null);

  const set = <K extends keyof StyleOverrides>(key: K, value: StyleOverrides[K] | undefined) => {
    const style = setOverride(meta.style, key, value, template.defaults);
    const next: CvMeta = { ...meta, style };
    if (!style) delete next.style;
    onChange(next);
  };

  const accentRgb = hexToRgb(resolved.accent);
  const contrast = accentRgb ? contrastRatio(accentRgb, pageColor) : 21;
  const overrideCount = Object.keys(overrides).length;

  return (
    <FormSection id="design" title="Design" icon={Palette} {...chrome}>
      <div className="ui-template-current">
        <div>
          <div className="ui-template-name">{template.name}</div>
          <div className="ui-hint">
            {skeleton.name} · {template.description}
          </div>
        </div>
        <button type="button" className="ui-btn" onClick={() => setGalleryOpen(true)}>
          <LayoutTemplate size={15} /> Templates…
        </button>
      </div>

      <div className="ui-knobs">
        <Knob label="Accent" overridden={overrides.accent !== undefined} onReset={() => set('accent', undefined)}>
          {(id) => (
            <div className="ui-color">
              <input
                id={id}
                type="color"
                value={resolved.accent}
                onChange={(e) => set('accent', e.target.value)}
              />
              <input
                type="text"
                aria-label="Accent hex value"
                spellCheck={false}
                value={accentDraft ?? resolved.accent}
                onChange={(e) => {
                  setAccentDraft(e.target.value);
                  const hex = normalizeHex(e.target.value);
                  if (hex && e.target.value.trim().length === 7) set('accent', hex);
                }}
                onBlur={() => setAccentDraft(null)}
              />
            </div>
          )}
        </Knob>
        {contrast < MIN_ACCENT_CONTRAST && (
          <p className="ui-warning" role="status">
            <TriangleAlert size={15} />
            <span>
              Accent contrast against the page is {contrast.toFixed(2)}:1, below {MIN_ACCENT_CONTRAST}:1.
              Accent text, rules and icons may be hard to read, especially when printed.
            </span>
          </p>
        )}

        <Knob
          label="Fonts"
          overridden={overrides.fontPairing !== undefined}
          onReset={() => set('fontPairing', undefined)}
        >
          {(id) => (
            <select
              id={id}
              value={resolved.fontPairing}
              onChange={(e) => set('fontPairing', e.target.value as StyleOverrides['fontPairing'])}
            >
              {FONT_PAIRINGS.map((f) => (
                <option key={f} value={f}>
                  {FONT_PAIRING_STACKS[f].label}
                </option>
              ))}
            </select>
          )}
        </Knob>

        <Knob label="Density" overridden={overrides.density !== undefined} onReset={() => set('density', undefined)}>
          {(id) => (
            <Segmented
              id={id}
              options={DENSITIES}
              labels={DENSITY_LABELS}
              value={resolved.density}
              onChange={(v) => set('density', v)}
            />
          )}
        </Knob>

        <Knob
          label="Section headers"
          overridden={overrides.headerCase !== undefined}
          onReset={() => set('headerCase', undefined)}
        >
          {(id) => (
            <Segmented
              id={id}
              options={HEADER_CASES}
              labels={CASE_LABELS}
              value={resolved.headerCase}
              onChange={(v) => set('headerCase', v)}
            />
          )}
        </Knob>

        <Knob
          label={`Sidebar width · ${resolved.sidebarWidth}%`}
          overridden={overrides.sidebarWidth !== undefined}
          onReset={() => set('sidebarWidth', undefined)}
          hint={skeleton.usesSidebarWidth ? undefined : 'Only applies to sidebar templates; kept for when you switch.'}
        >
          {(id) => (
            <input
              id={id}
              type="range"
              min={SIDEBAR_WIDTH_RANGE.min}
              max={SIDEBAR_WIDTH_RANGE.max}
              step={1}
              disabled={!skeleton.usesSidebarWidth}
              value={resolved.sidebarWidth}
              onChange={(e) => set('sidebarWidth', Number(e.target.value))}
            />
          )}
        </Knob>

        <Knob
          label={`Type scale · ${resolved.typeScale}%`}
          overridden={overrides.typeScale !== undefined}
          onReset={() => set('typeScale', undefined)}
        >
          {(id) => (
            <input
              id={id}
              type="range"
              min={TYPE_SCALE_RANGE.min}
              max={TYPE_SCALE_RANGE.max}
              step={5}
              value={resolved.typeScale}
              onChange={(e) => set('typeScale', Number(e.target.value))}
            />
          )}
        </Knob>
      </div>

      <button
        type="button"
        className="ui-btn ui-btn-ghost"
        disabled={overrideCount === 0}
        onClick={() => {
          const next = { ...meta };
          delete next.style;
          onChange(next);
        }}
      >
        <RotateCcw size={15} /> Reset to template
        {overrideCount > 0 && ` (${overrideCount})`}
      </button>

      {galleryOpen && (
        <TemplateGallery
          doc={doc}
          onClose={() => setGalleryOpen(false)}
          onPick={(templateId) => {
            onChange({ ...meta, templateId });
            setGalleryOpen(false);
          }}
        />
      )}
    </FormSection>
  );
}
