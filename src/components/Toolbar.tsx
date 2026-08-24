import { useRef } from 'react'
import {
  PREVIEW_SCALE_DEFAULT,
  PREVIEW_SCALE_MAX,
  PREVIEW_SCALE_MIN,
} from '@/hooks/usePreviewScale'
import { TemplateGallery } from '@/components/TemplateGallery'

type Props = {
  status: string | null
  templateId: string
  scalePercent: number
  onScaleChange: (value: number) => void
  onScaleReset: () => void
  onTemplateChange: (templateId: string) => void
  onExport: () => void
  onImportFile: (file: File) => void
  onPrint: () => void
  fsaSupported: boolean
  fileName: string | null
  dirty: boolean
  onOpenFile: () => void
  onSaveFile: () => void
}

export function Toolbar({
  status,
  templateId,
  scalePercent,
  onScaleChange,
  onScaleReset,
  onTemplateChange,
  onExport,
  onImportFile,
  onPrint,
  fsaSupported,
  fileName,
  dirty,
  onOpenFile,
  onSaveFile,
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null)

  return (
    <header className="toolbar no-print">
      <div className="toolbar__brand">
        <span className="toolbar__logo">cvStudio</span>
        <span className="toolbar__tag">
          import JSON → edit → print PDF · data stays in this browser
        </span>
      </div>

      <div className="toolbar__controls">
        <TemplateGallery
          templateId={templateId}
          onTemplateChange={onTemplateChange}
        />

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

        {fsaSupported ? (
          <>
            <button type="button" className="btn" onClick={onOpenFile}>
              Open…
            </button>
            <button
              type="button"
              className="btn"
              onClick={onSaveFile}
              title={fileName ? `Save to ${fileName}` : 'Save to a file'}
            >
              {fileName ? 'Save' : 'Save…'}
              {dirty ? <span className="toolbar__dirty" aria-hidden="true"> •</span> : null}
            </button>
            {fileName ? (
              <span className="toolbar__file" title={fileName}>
                {fileName}
                {dirty ? ' · unsaved' : ''}
              </span>
            ) : null}
          </>
        ) : (
          <button
            type="button"
            className="btn"
            onClick={() => fileRef.current?.click()}
          >
            Import JSON
          </button>
        )}
        <button type="button" className="btn" onClick={onExport}>
          Export JSON
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
