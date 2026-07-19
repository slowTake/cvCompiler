import { useEffect, useState } from 'react'
import publicSeed from '@data/cv.public.json'
import privateExample from '@data/cv.private.example.json'
import type { CvDocument, DatasetId } from '@/types/cv'
import { downloadCvJson, loadStoredCv, saveStoredCv } from '@/lib/storage'

const privateDiskModules = import.meta.glob<CvDocument>('@data/cv.private.json', {
  eager: true,
  import: 'default',
})

function loadPrivateSeed(): CvDocument {
  const fromDisk = Object.values(privateDiskModules)[0]
  return clone((fromDisk ?? privateExample) as CvDocument)
}

function clone<T>(value: T): T {
  return structuredClone(value)
}

export function useCvDocument() {
  const [dataset, setDataset] = useState<DatasetId>('private')
  const [docs, setDocs] = useState<Record<DatasetId, CvDocument> | null>(null)
  const [dirty, setDirty] = useState(false)
  const [status, setStatus] = useState<string | null>(null)

  useEffect(() => {
    setDocs({
      public: loadStoredCv('public') ?? clone(publicSeed as CvDocument),
      private: loadStoredCv('private') ?? loadPrivateSeed(),
    })
  }, [])

  const cv = docs?.[dataset] ?? null

  function updateCv(next: CvDocument | ((prev: CvDocument) => CvDocument)) {
    setDocs((prev) => {
      if (!prev) return prev
      const current = prev[dataset]
      const resolved = typeof next === 'function' ? next(current) : next
      return { ...prev, [dataset]: resolved }
    })
    setDirty(true)
    setStatus(null)
  }

  function switchDataset(next: DatasetId) {
    setDataset(next)
    setStatus(null)
  }

  function save() {
    if (!docs) return
    const current = docs[dataset]
    const stamped: CvDocument = {
      ...current,
      meta: {
        ...current.meta,
        updatedAt: new Date().toISOString().slice(0, 10),
      },
    }
    saveStoredCv(dataset, stamped)
    downloadCvJson(dataset, stamped)
    setDocs({ ...docs, [dataset]: stamped })
    setDirty(false)
    setStatus(
      `Saved ${dataset} dataset to browser storage and downloaded ${
        dataset === 'private' ? 'cv.private.json' : 'cv.public.json'
      }.`,
    )
  }

  function resetToSeed() {
    const seed =
      dataset === 'public'
        ? clone(publicSeed as CvDocument)
        : loadPrivateSeed()
    setDocs((prev) => (prev ? { ...prev, [dataset]: seed } : prev))
    setDirty(true)
    setStatus(`Reset ${dataset} view to seed file (not saved yet).`)
  }

  return {
    ready: docs !== null,
    dataset,
    cv,
    dirty,
    status,
    switchDataset,
    updateCv,
    save,
    resetToSeed,
  }
}
