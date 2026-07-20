import { useRef } from 'react'
import type { DatasetId } from '@/types/cv'
import {
  PREVIEW_SCALE_DEFAULT,
  PREVIEW_SCALE_MAX,
  PREVIEW_SCALE_MIN,
} from '@/hooks/usePreviewScale'
import { listTemplates } from '@/templates/registry'

type Props = {
  isDemoMode: boolean
  dataset: DatasetId
  status: string | null
  templateId: string
  scalePercent: number
  onScaleChange: (value: number) => void
  onScaleReset: () => void
  onDatasetChange: (dataset: DatasetId) => void
  onTemplateChange: (templateId: string) => void
  onExport: () => void
  onImportFile: (file: File) => void
  onReset: () => void
  onPrint: () => void
}

export function Toolbar({
  isDemoMode,
  dataset,
  status,
  templateId,
  scalePercent,
  onScaleChange,
  onScaleReset,
  onDatasetChange,
  onTemplateChange,
  onExport,
  onImportFile,
  onReset,
  onPrint,
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null)
  const templates = listTemplates()

  return (
    <header className="toolbar no-print">
      <div className="toolbar__brand">
        <span className="toolbar__logo">cvStudio</span>
        <span className="toolbar__tag">
          {isDemoMode
            ? 'import JSON → edit → print PDF · data stays in this browser'
            : 'form → A4 → print PDF'}
        </span>
      </div>

      <div className="toolbar__controls">
        {!isDemoMode ? (
          <div className="dataset-toggle" role="group" aria-label="Dataset">
            <button
              type="button"
              className={dataset === 'private' ? 'is-active' : undefined}
              onClick={() => onDatasetChange('private')}
            >
              Private
            </button>
            <button
              type="button"
              className={dataset === 'public' ? 'is-active' : undefined}
              onClick={() => onDatasetChange('public')}
            >
              Public
            </button>
          </div>
        ) : null}

        <label className="toolbar-select">
          <span className="toolbar-select__label">Template</span>
          <select
            value={templateId}
            onChange={(e) => onTemplateChange(e.target.value)}
            aria-label="CV template"
          >
            {templates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
        </label>

        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="visually-hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) onImportFile(file)
            e.target.value = ''
          }}
        />

        <button
          type="button"
          className="btn"
          onClick={() => fileRef.current?.click()}
        >
          Import JSON
        </button>
        <button type="button" className="btn" onClick={onExport}>
          Export JSON
        </button>
        <button type="button" className="btn btn--ghost" onClick={onReset}>
          Reset seed
        </button>

        <label
          className="scale-control"
          title="Shrink or grow CV type for print fit"
        >
          <span className="scale-control__label">Type size</span>
          <input
            type="range"
            min={PREVIEW_SCALE_MIN}
            max={PREVIEW_SCALE_MAX}
            step={1}
            value={scalePercent}
            onChange={(e) => onScaleChange(Number(e.target.value))}
            aria-valuemin={PREVIEW_SCALE_MIN}
            aria-valuemax={PREVIEW_SCALE_MAX}
            aria-valuenow={scalePercent}
            aria-label="CV type size percent"
          />
          <span className="scale-control__value">{scalePercent}%</span>
          <button
            type="button"
            className="btn btn--ghost scale-control__reset"
            disabled={scalePercent === PREVIEW_SCALE_DEFAULT}
            onClick={onScaleReset}
          >
            Reset
          </button>
        </label>

        <button type="button" className="btn btn--primary" onClick={onPrint}>
          Print / Save PDF
        </button>
      </div>

      <p className="toolbar__hint">
        Print tip: set margins to <strong>None</strong> and enable{' '}
        <strong>Background graphics</strong>.
      </p>

      {status ? <p className="toolbar__status">{status}</p> : null}
    </header>
  )
}
