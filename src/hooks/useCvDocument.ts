import { useEffect, useState } from 'react'
import publicSeed from '@data/cv.public.json'
import type { CvDocument } from '@/types/cv'
import {
  downloadCvJson,
  loadStoredCv,
  normalizeCvDocument,
  parseCvJson,
  saveStoredCv,
} from '@/lib/storage'

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

export function useCvDocument() {
  const [cv, setCv] = useState<CvDocument | null>(null)
  const [status, setStatus] = useState<string | null>(null)

  useEffect(() => {
    const stored =
      loadStoredCv(STORAGE_KEY) ??
      loadStoredCv('demo') ??
      loadStoredCv('public')
    setCv(stored ?? loadInitialSeed())
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
    setStatus(null)
  }

  function setTemplateId(templateId: string) {
    updateCv((prev) => ({
      ...prev,
      meta: { ...prev.meta, templateId },
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

  return {
    ready: cv !== null,
    cv,
    status,
    updateCv,
    setTemplateId,
    exportJson,
    importJsonFile,
  }
}
