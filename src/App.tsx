import { useEffect } from 'react'
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
    fsaSupported,
    fileName,
    dirty,
    openFile,
    saveToFile,
  } = useCvDocument()
  const { scalePercent, scaleFactor, setScalePercent, resetScale } =
    usePreviewScale()

  // Cmd/Ctrl+S saves to the bound file when the File System Access API is available.
  useEffect(() => {
    if (!fsaSupported) return
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
        e.preventDefault()
        void saveToFile()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [fsaSupported, saveToFile])

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
        fsaSupported={fsaSupported}
        fileName={fileName}
        dirty={dirty}
        onOpenFile={openFile}
        onSaveFile={saveToFile}
      />

      <div className="app-split">
        <aside className="app-form-pane no-print">
          <p className="form-persistence-note">
            Edits auto-save in this browser.{' '}
            {fsaSupported ? (
              <>
                <strong>Open</strong> a file and <strong>Save</strong> (⌘/Ctrl+S)
                to keep a durable copy on disk.
              </>
            ) : (
              <>
                <strong>Export JSON</strong> downloads a backup file. Import
                anytime to restore.
              </>
            )}
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
