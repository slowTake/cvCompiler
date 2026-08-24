import { CvForm } from '@/components/form/CvForm'
import { Toolbar } from '@/components/Toolbar'
import { CvPreview } from '@/components/preview/CvPreview'
import { useCvDocument } from '@/hooks/useCvDocument'
import { usePreviewScale } from '@/hooks/usePreviewScale'
import { resolveTemplateId } from '@/types/cv'

export default function App() {
  const {
    ready,
    cv,
    status,
    updateCv,
    setTemplateId,
    exportJson,
    importJsonFile,
  } = useCvDocument()
  const { scalePercent, scaleFactor, setScalePercent, resetScale } =
    usePreviewScale()

  if (!ready || !cv) {
    return (
      <div className="app-loading">
        <p>Loading cvStudio…</p>
      </div>
    )
  }

  const templateId = resolveTemplateId(cv)

  return (
    <div className="app-shell">
      <Toolbar
        status={status}
        templateId={templateId}
        scalePercent={scalePercent}
        onScaleChange={setScalePercent}
        onScaleReset={resetScale}
        onTemplateChange={setTemplateId}
        onExport={exportJson}
        onImportFile={importJsonFile}
        onPrint={() => window.print()}
      />

      <div className="app-split">
        <aside className="app-form-pane no-print">
          <p className="form-persistence-note">
            Edits auto-save in this browser.{' '}
            <strong>Export JSON</strong> downloads a backup file. Import anytime
            to restore.
          </p>
          <CvForm cv={cv} onChange={updateCv} />
        </aside>
        <section className="app-preview-pane" aria-label="A4 preview">
          <CvPreview cv={cv} scale={scaleFactor} />
        </section>
      </div>
    </div>
  )
}
