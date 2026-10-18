import { useEffect, useState } from 'react'
import publicSeed from '@data/cv.public.json'
import type { CvDocument, CvStyle } from '@/types/cv'
import {
  LEGACY_TYPE_SCALE_KEY,
  applyLegacyTypeScale,
  downloadCvJson,
  loadStoredCv,
  normalizeCvDocument,
  parseCvJson,
  saveStoredCv,
  serializeCv,
} from '@/lib/storage'
import {
  isFsaSupported,
  pickOpenCvFile,
  pickSaveCvFile,
  writeCvFile,
} from '@/lib/fileAccess'

const STORAGE_KEY = 'cv'

/** Prefer owner private file in DEV only; never bundle it for production. */
function loadInitialSeed(): CvDocument {
  if (import.meta.env.DEV) {
    const privateDiskModules = import.meta.glob<CvDocument>(
      '@data/cv.private.json',
      {
        eager: true,
        import: 'default',
      },
    )
    const fromDisk = Object.values(privateDiskModules)[0]
    if (fromDisk) return normalizeCvDocument(clone(fromDisk))
  }
  return normalizeCvDocument(clone(publicSeed as CvDocument))
}

function clone<T>(value: T): T {
  return structuredClone(value)
}

/** One-time move of the old per-browser Type size into the document (ADR 0007). */
function migrateLegacyTypeScale(cv: CvDocument): CvDocument {
  try {
    const raw = localStorage.getItem(LEGACY_TYPE_SCALE_KEY)
    if (raw === null) return cv
    const next = applyLegacyTypeScale(cv, raw)
    if (next !== cv) saveStoredCv(STORAGE_KEY, next)
    localStorage.removeItem(LEGACY_TYPE_SCALE_KEY)
    return next
  } catch {
    return cv
  }
}

export function useCvDocument() {
  const [cv, setCv] = useState<CvDocument | null>(null)
  const [status, setStatus] = useState<string | null>(null)
  // Durable file binding (ADR 0006). Held in memory for the session; not
  // restored across reloads (localStorage is the reload cache).
  const [fileHandle, setFileHandle] = useState<FileSystemFileHandle | null>(null)
  const [dirty, setDirty] = useState(false)
  const fsaSupported = isFsaSupported()

  useEffect(() => {
    const stored =
      loadStoredCv(STORAGE_KEY) ??
      loadStoredCv('demo') ??
      loadStoredCv('public')
    setCv(migrateLegacyTypeScale(stored ?? loadInitialSeed()))
  }, [])

  function updateCv(next: CvDocument | ((prev: CvDocument) => CvDocument)) {
    setCv((prev) => {
      if (!prev) return prev
      const resolved = normalizeCvDocument(
        typeof next === 'function' ? next(prev) : next,
      )
      saveStoredCv(STORAGE_KEY, resolved)
      return resolved
    })
    setDirty(true)
    setStatus(null)
  }

  function setTemplateId(templateId: string) {
    updateCv((prev) => ({
      ...prev,
      meta: { ...prev.meta, templateId },
    }))
  }

  /** Merge style overrides; a key set to `undefined` falls back to the template. */
  function updateStyle(patch: Partial<CvStyle>) {
    updateCv((prev) => ({
      ...prev,
      meta: { ...prev.meta, style: { ...prev.meta.style, ...patch } },
    }))
  }

  /** Drop every visual override; Type size is kept (it has its own reset). */
  function resetDesign() {
    updateCv((prev) => ({
      ...prev,
      meta: { ...prev.meta, style: { typeScale: prev.meta.style?.typeScale } },
    }))
  }

  function exportJson() {
    if (!cv) return
    const current = normalizeCvDocument({
      ...cv,
      meta: {
        ...cv.meta,
        updatedAt: new Date().toISOString().slice(0, 10),
      },
    })
    saveStoredCv(STORAGE_KEY, current)
    downloadCvJson('cv.json', current)
    setCv(current)
    setStatus('Exported cv.json (also kept in this browser).')
  }

  function importJsonText(raw: string) {
    const parsed = parseCvJson(raw)
    if (!parsed.ok) {
      setStatus(`Import failed: ${parsed.error}`)
      return
    }
    const next = parsed.cv
    setCv(next)
    saveStoredCv(STORAGE_KEY, next)
    setDirty(false)
    setStatus('Imported JSON and saved to this browser.')
  }

  async function importJsonFile(file: File) {
    try {
      const raw = await file.text()
      importJsonText(raw)
    } catch {
      setStatus('Import failed: could not read file.')
    }
  }

  /** Bind a file and load it (File System Access API). */
  async function openFile() {
    const picked = await pickOpenCvFile()
    if (!picked) return // user cancelled
    const parsed = parseCvJson(picked.text)
    if (!parsed.ok) {
      setStatus(`Open failed: ${parsed.error}`)
      return
    }
    setCv(parsed.cv)
    saveStoredCv(STORAGE_KEY, parsed.cv)
    setFileHandle(picked.handle)
    setDirty(false)
    setStatus(`Opened ${picked.handle.name} — Save writes back to it.`)
  }

  /** Write the current document to the bound file (or bind one via Save As). */
  async function saveToFile() {
    if (!cv) return
    let handle = fileHandle
    if (!handle) {
      handle = await pickSaveCvFile('cv.json')
      if (!handle) return // user cancelled
      setFileHandle(handle)
    }
    const doc = normalizeCvDocument({
      ...cv,
      meta: { ...cv.meta, updatedAt: new Date().toISOString().slice(0, 10) },
    })
    try {
      await writeCvFile(handle, serializeCv(doc))
    } catch {
      setStatus('Save failed: could not write to the file.')
      return
    }
    saveStoredCv(STORAGE_KEY, doc)
    setCv(doc)
    setDirty(false)
    setStatus(`Saved to ${handle.name}.`)
  }

  return {
    ready: cv !== null,
    cv,
    status,
    updateCv,
    setTemplateId,
    updateStyle,
    resetDesign,
    exportJson,
    importJsonFile,
    fsaSupported,
    fileName: fileHandle?.name ?? null,
    dirty,
    openFile,
    saveToFile,
  }
}
