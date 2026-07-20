import { useEffect, useState } from 'react'
import publicSeed from '@data/cv.public.json'
import privateExample from '@data/cv.private.example.json'
import type { CvDocument, DatasetId } from '@/types/cv'
import {
  downloadCvJson,
  exportFilename,
  loadStoredCv,
  normalizeCvDocument,
  parseCvJson,
  saveStoredCv,
} from '@/lib/storage'

const isProd = import.meta.env.PROD

/** Private on-disk CV — only resolved in DEV so production builds never bundle it. */
function loadPrivateSeed(): CvDocument {
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
  return normalizeCvDocument(clone(privateExample as CvDocument))
}

function clone<T>(value: T): T {
  return structuredClone(value)
}

function seedPublic(): CvDocument {
  return normalizeCvDocument(clone(publicSeed as CvDocument))
}

export function useCvDocument() {
  const [dataset, setDataset] = useState<DatasetId>(
    isProd ? 'public' : 'private',
  )
  const [docs, setDocs] = useState<Record<DatasetId, CvDocument> | null>(null)
  const [dirty, setDirty] = useState(false)
  const [status, setStatus] = useState<string | null>(null)

  useEffect(() => {
    if (isProd) {
      const demo =
        loadStoredCv('demo') ?? loadStoredCv('public') ?? seedPublic()
      setDocs({
        public: demo,
        private: seedPublic(),
      })
      setDataset('public')
      return
    }

    setDocs({
      public: loadStoredCv('public') ?? seedPublic(),
      private: loadStoredCv('private') ?? loadPrivateSeed(),
    })
  }, [])

  const cv = docs?.[dataset] ?? null
  const storageDataset = isProd ? 'demo' : dataset

  function updateCv(next: CvDocument | ((prev: CvDocument) => CvDocument)) {
    setDocs((prev) => {
      if (!prev) return prev
      const current = prev[dataset]
      const resolved = typeof next === 'function' ? next(current) : next
      return {
        ...prev,
        [dataset]: normalizeCvDocument(resolved),
      }
    })
    setDirty(true)
    setStatus(null)
  }

  function switchDataset(next: DatasetId) {
    if (isProd) return
    setDataset(next)
    setStatus(null)
  }

  function setTemplateId(templateId: string) {
    updateCv((prev) => ({
      ...prev,
      meta: { ...prev.meta, templateId },
    }))
  }

  function exportJson() {
    if (!docs) return
    const current = normalizeCvDocument(docs[dataset])
    downloadCvJson(exportFilename(storageDataset), current)
    setStatus(`Downloaded ${exportFilename(storageDataset)}.`)
  }

  function save() {
    if (!docs) return
    const current = normalizeCvDocument({
      ...docs[dataset],
      meta: {
        ...docs[dataset].meta,
        updatedAt: new Date().toISOString().slice(0, 10),
      },
    })
    saveStoredCv(storageDataset, current)
    downloadCvJson(exportFilename(storageDataset), current)
    setDocs({ ...docs, [dataset]: current })
    setDirty(false)
    setStatus(
      `Saved to this browser and downloaded ${exportFilename(storageDataset)}.`,
    )
  }

  function importJsonText(raw: string) {
    const parsed = parseCvJson(raw)
    if (!parsed.ok) {
      setStatus(`Import failed: ${parsed.error}`)
      return
    }
    const next = parsed.cv
    setDocs((prev) => (prev ? { ...prev, [dataset]: next } : prev))
    saveStoredCv(storageDataset, next)
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

  function resetToSeed() {
    const seed = isProd || dataset === 'public' ? seedPublic() : loadPrivateSeed()
    setDocs((prev) => (prev ? { ...prev, [dataset]: seed } : prev))
    setDirty(true)
    setStatus(
      isProd
        ? 'Reset to demo seed (not saved yet — Export or Save to keep).'
        : `Reset ${dataset} view to seed file (not saved yet).`,
    )
  }

  return {
    ready: docs !== null,
    isDemoMode: isProd,
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
  }
}
