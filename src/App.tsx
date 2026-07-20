import { CvForm } from '@/components/form/CvForm'
import { Toolbar } from '@/components/Toolbar'
import { useCvDocument } from '@/hooks/useCvDocument'
import { usePreviewScale } from '@/hooks/usePreviewScale'
import { getTemplate } from '@/templates/registry'
import { resolveTemplateId } from '@/types/cv'

export default function App() {
  const {
    ready,
    isDemoMode,
    dataset,
    cv,
    dirty,
    status,
    switchDataset,
    updateCv,
    setTemplateId,
    save,
    exportJson,
    importJsonFile,
    resetToSeed,
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
  const { Preview } = getTemplate(templateId)

  return (
    <div className="app-shell">
      <Toolbar
        isDemoMode={isDemoMode}
        dataset={dataset}
        dirty={dirty}
        status={status}
        templateId={templateId}
        scalePercent={scalePercent}
        onScaleChange={setScalePercent}
        onScaleReset={resetScale}
        onDatasetChange={switchDataset}
        onTemplateChange={setTemplateId}
        onSave={save}
        onExport={exportJson}
        onImportFile={importJsonFile}
        onReset={resetToSeed}
        onPrint={() => window.print()}
      />

      <div className="app-split">
        <aside className="app-form-pane no-print">
          <p className="form-persistence-note">
            Edits stay in this browser until you <strong>Export JSON</strong>.
            Import a backup anytime.
          </p>
          <CvForm cv={cv} onChange={updateCv} />
        </aside>
        <section className="app-preview-pane" aria-label="A4 preview">
          <Preview cv={cv} scale={scaleFactor} />
        </section>
      </div>
    </div>
  )
}
