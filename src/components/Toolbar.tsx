import type { DatasetId } from '@/types/cv'
import {
  PREVIEW_SCALE_DEFAULT,
  PREVIEW_SCALE_MAX,
  PREVIEW_SCALE_MIN,
} from '@/hooks/usePreviewScale'

type Props = {
  dataset: DatasetId
  dirty: boolean
  status: string | null
  scalePercent: number
  onScaleChange: (value: number) => void
  onScaleReset: () => void
  onDatasetChange: (dataset: DatasetId) => void
  onSave: () => void
  onReset: () => void
  onPrint: () => void
}

export function Toolbar({
  dataset,
  dirty,
  status,
  scalePercent,
  onScaleChange,
  onScaleReset,
  onDatasetChange,
  onSave,
  onReset,
  onPrint,
}: Props) {
  return (
    <header className="toolbar no-print">
      <div className="toolbar__brand">
        <span className="toolbar__logo">cvStudio</span>
        <span className="toolbar__tag">form → A4 → print PDF</span>
      </div>

      <div className="toolbar__controls">
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

        <label className="scale-control" title="Shrink or grow CV type for print fit">
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

        <button type="button" className="btn" onClick={onSave}>
          Save JSON{dirty ? ' *' : ''}
        </button>
        <button type="button" className="btn btn--ghost" onClick={onReset}>
          Reset seed
        </button>
        <button type="button" className="btn btn--primary" onClick={onPrint}>
          Print / Save PDF
        </button>
      </div>

      {status ? <p className="toolbar__status">{status}</p> : null}
    </header>
  )
}
