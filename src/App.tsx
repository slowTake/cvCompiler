import { useEffect, useState } from 'react'
import { CvForm } from '@/components/form/CvForm'
import { Toolbar } from '@/components/Toolbar'
import { TemplateGallery } from '@/components/TemplateGallery'
import { CvPreview } from '@/components/preview/CvPreview'
import { DesignPanel } from '@/components/design/DesignPanel'
import { useCvDocument } from '@/hooks/useCvDocument'
import { resolveTemplateId } from '@/types/cv'

type PaneTab = 'content' | 'design'

const PANE_TAB_KEY = 'cvstudio:pane-tab'

function loadPaneTab(): PaneTab {
  try {
    return localStorage.getItem(PANE_TAB_KEY) === 'design' ? 'design' : 'content'
  } catch {
    return 'content'
  }
}

export default function App() {
  const {
    ready,
    cv,
    status,
    updateCv,
    setTemplateId,
    updateStyle,
    resetDesign,
    exportJson,
    importJsonFile,
    fsaSupported,
    fileName,
    dirty,
    openFile,
    saveToFile,
  } = useCvDocument()
  const [paneTab, setPaneTabState] = useState<PaneTab>(loadPaneTab)
  const [galleryOpen, setGalleryOpen] = useState(false)

  function setPaneTab(next: PaneTab) {
    setPaneTabState(next)
    try {
      localStorage.setItem(PANE_TAB_KEY, next)
    } catch {
      // ignore storage failures (private mode, quota)
    }
  }

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
        onOpenGallery={() => setGalleryOpen(true)}
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
          <div className="pane-tabs" role="tablist" aria-label="Editor">
            {(['content', 'design'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                role="tab"
                id={`pane-tab-${tab}`}
                aria-selected={paneTab === tab}
                aria-controls={`pane-panel-${tab}`}
                className={`pane-tabs__tab${paneTab === tab ? ' pane-tabs__tab--active' : ''}`}
                onClick={() => setPaneTab(tab)}
              >
                {tab === 'content' ? 'Content' : 'Design'}
              </button>
            ))}
          </div>
          <div
            role="tabpanel"
            id={`pane-panel-${paneTab}`}
            aria-labelledby={`pane-tab-${paneTab}`}
          >
            {paneTab === 'content' ? (
              <CvForm cv={cv} onChange={updateCv} />
            ) : (
              <DesignPanel
                cv={cv}
                onStyleChange={updateStyle}
                onReset={resetDesign}
                onOpenGallery={() => setGalleryOpen(true)}
              />
            )}
          </div>
        </aside>
        <section className="app-preview-pane" aria-label="A4 preview">
          <CvPreview cv={cv} />
        </section>
      </div>

      <TemplateGallery
        open={galleryOpen}
        cv={cv}
        onClose={() => setGalleryOpen(false)}
        onSelect={setTemplateId}
      />
    </div>
  )
}
