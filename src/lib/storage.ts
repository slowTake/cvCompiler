import type { CvDocument, DatasetId } from '@/types/cv'

const storageKey = (dataset: DatasetId) => `cvstudio:${dataset}`

export function loadStoredCv(dataset: DatasetId): CvDocument | null {
  try {
    const raw = localStorage.getItem(storageKey(dataset))
    if (!raw) return null
    return JSON.parse(raw) as CvDocument
  } catch {
    return null
  }
}

export function saveStoredCv(dataset: DatasetId, cv: CvDocument): void {
  localStorage.setItem(storageKey(dataset), JSON.stringify(cv))
}

export function downloadCvJson(dataset: DatasetId, cv: CvDocument): void {
  const blob = new Blob([JSON.stringify(cv, null, 2) + '\n'], {
    type: 'application/json',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = dataset === 'private' ? 'cv.private.json' : 'cv.public.json'
  a.click()
  URL.revokeObjectURL(url)
}
