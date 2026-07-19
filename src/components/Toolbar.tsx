import type { DatasetId } from '@/types/cv'

type Props = {
  dataset: DatasetId
  dirty: boolean
  status: string | null
  onDatasetChange: (dataset: DatasetId) => void
  onSave: () => void
  onReset: () => void
  onPrint: () => void
}

export function Toolbar({
  dataset,
  dirty,
  status,
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
