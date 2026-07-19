import { CvForm } from '@/components/form/CvForm'
import { CvPreview } from '@/components/preview/CvPreview'
import { Toolbar } from '@/components/Toolbar'
import { useCvDocument } from '@/hooks/useCvDocument'

export default function App() {
  const {
    ready,
    dataset,
    cv,
    dirty,
    status,
    switchDataset,
    updateCv,
    save,
    resetToSeed,
  } = useCvDocument()

  if (!ready || !cv) {
    return (
      <div className="app-loading">
        <p>Loading cvStudio…</p>
      </div>
    )
  }

  return (
    <div className="app-shell">
      <Toolbar
        dataset={dataset}
        dirty={dirty}
        status={status}
        onDatasetChange={switchDataset}
        onSave={save}
        onReset={resetToSeed}
        onPrint={() => window.print()}
      />

      <div className="app-split">
        <aside className="app-form-pane no-print">
          <CvForm cv={cv} onChange={updateCv} />
        </aside>
        <section className="app-preview-pane" aria-label="A4 preview">
          <CvPreview cv={cv} />
        </section>
      </div>
    </div>
  )
}
