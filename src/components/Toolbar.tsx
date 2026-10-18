import { useEffect, useRef, useState, type ReactNode } from 'react'
import { ChevronDown, CircleHelp, Printer } from 'lucide-react'
import { getTemplate } from '@/templates/registry'
import { TemplateThumb } from '@/components/preview/TemplateThumb'

type Props = {
  status: string | null
  templateId: string
  onOpenGallery: () => void
  onExport: () => void
  onImportFile: (file: File) => void
  onPrint: () => void
  fsaSupported: boolean
  fileName: string | null
  dirty: boolean
  onOpenFile: () => void
  onSaveFile: () => void
}

/** Button + panel that closes on outside click, Escape, or picking an item. */
function Popover({
  label,
  trigger,
  className,
  children,
}: {
  label: string
  trigger: ReactNode
  className?: string
  children: (close: () => void) => ReactNode
}) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onPointer(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div className="popover" ref={rootRef}>
      <button
        type="button"
        className={className ?? 'btn'}
        aria-label={label}
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen((v) => !v)}
      >
        {trigger}
      </button>
      {open ? <div className="popover__panel">{children(() => setOpen(false))}</div> : null}
    </div>
  )
}

export function Toolbar({
  status,
  templateId,
  onOpenGallery,
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
  const template = getTemplate(templateId)

  return (
    <header className="toolbar no-print">
      <div className="toolbar__brand">
        <span className="toolbar__logo">cvStudio</span>
        <span className="toolbar__doc" aria-live="polite">
          {status ??
            (fileName
              ? `${fileName}${dirty ? ' · unsaved changes' : ' · saved'}`
              : 'Auto-saved in this browser')}
        </span>
      </div>

      <div className="toolbar__controls">
        <button
          type="button"
          className="template-picker__trigger"
          aria-haspopup="dialog"
          title="Choose a template"
          onClick={onOpenGallery}
        >
          <TemplateThumb themeId={template.themeId} skeletonId={template.skeletonId} />
          <span className="template-picker__name">{template.label}</span>
          <ChevronDown size={14} aria-hidden />
        </button>

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

        <Popover
          label="File"
          trigger={
            <>
              File
              {dirty && fileName ? (
                <span className="toolbar__dirty" aria-hidden="true">
                  •
                </span>
              ) : null}
              <ChevronDown size={14} aria-hidden />
            </>
          }
        >
          {(close) => (
            <div className="menu" role="menu" aria-label="File">
              {fsaSupported ? (
                <>
                  <MenuItem
                    onClick={() => {
                      close()
                      onOpenFile()
                    }}
                    hint="Edit a file on disk"
                  >
                    Open…
                  </MenuItem>
                  <MenuItem
                    onClick={() => {
                      close()
                      onSaveFile()
                    }}
                    hint="⌘/Ctrl+S"
                  >
                    {fileName ? `Save to ${fileName}` : 'Save as…'}
                  </MenuItem>
                </>
              ) : (
                <MenuItem
                  onClick={() => {
                    close()
                    fileRef.current?.click()
                  }}
                  hint="Load a .json file"
                >
                  Import JSON…
                </MenuItem>
              )}
              <MenuItem
                onClick={() => {
                  close()
                  onExport()
                }}
                hint="Download a backup"
              >
                Export JSON
              </MenuItem>
            </div>
          )}
        </Popover>

        <Popover
          label="Help"
          className="btn btn--icon"
          trigger={<CircleHelp size={17} aria-hidden />}
        >
          {() => (
            <div className="help">
              <p>
                <strong>Your data stays here.</strong> Edits auto-save in this
                browser; nothing is uploaded.
              </p>
              <p>
                {fsaSupported ? (
                  <>
                    For a durable copy, <strong>File → Open</strong> a <code>.json</code>{' '}
                    and <strong>Save</strong> (⌘/Ctrl+S) writes back to it.
                  </>
                ) : (
                  <>
                    For a durable copy, <strong>File → Export JSON</strong> downloads a
                    backup; <strong>Import JSON</strong> restores it.
                  </>
                )}
              </p>
              <p>
                <strong>Printing:</strong> choose <em>Save as PDF</em>, set margins to{' '}
                <strong>None</strong> and turn on <strong>Background graphics</strong>.
              </p>
            </div>
          )}
        </Popover>

        <button type="button" className="btn btn--primary" onClick={onPrint}>
          <Printer size={16} aria-hidden />
          Print / Save PDF
        </button>
      </div>
    </header>
  )
}

function MenuItem({
  onClick,
  hint,
  children,
}: {
  onClick: () => void
  hint?: string
  children: ReactNode
}) {
  return (
    <button type="button" role="menuitem" className="menu__item" onClick={onClick}>
      <span>{children}</span>
      {hint ? <span className="menu__hint">{hint}</span> : null}
    </button>
  )
}
