import type { CvDocument } from '@/types/cv'
import { DEFAULT_TEMPLATE_ID } from '@/types/cv'

export type ParseCvResult =
  | { ok: true; cv: CvDocument }
  | { ok: false; error: string }

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string')
}

/** Ensure required top-level shape; fill safe defaults for missing meta.templateId. */
export function normalizeCvDocument(cv: CvDocument): CvDocument {
  return {
    ...cv,
    meta: {
      ...cv.meta,
      title: cv.meta.title || 'Curriculum Vitae',
      templateId: cv.meta.templateId?.trim() || DEFAULT_TEMPLATE_ID,
    },
    identity: {
      ...cv.identity,
      name: cv.identity.name ?? '',
      role: cv.identity.role ?? '',
      about: cv.identity.about ?? '',
      contact: Array.isArray(cv.identity.contact) ? cv.identity.contact : [],
      // Optional fields (Phase 3): keep absent when absent, coerce to [] when malformed.
      ...(cv.identity.links !== undefined
        ? { links: Array.isArray(cv.identity.links) ? cv.identity.links : [] }
        : {}),
    },
    skills: Array.isArray(cv.skills) ? cv.skills : [],
    education: Array.isArray(cv.education) ? cv.education : [],
    projects: Array.isArray(cv.projects) ? cv.projects : [],
    experience: Array.isArray(cv.experience) ? cv.experience : [],
    languages: Array.isArray(cv.languages) ? cv.languages : [],
  }
}

export function parseCvJson(raw: string): ParseCvResult {
  let data: unknown
  try {
    data = JSON.parse(raw) as unknown
  } catch {
    return { ok: false, error: 'File is not valid JSON.' }
  }

  if (!isRecord(data)) {
    return { ok: false, error: 'CV JSON must be an object.' }
  }

  if (!isRecord(data.meta) || typeof data.meta.title !== 'string') {
    return { ok: false, error: 'Missing meta.title.' }
  }

  if (!isRecord(data.identity) || typeof data.identity.name !== 'string') {
    return { ok: false, error: 'Missing identity.name.' }
  }

  // Optional fields (Phase 3): validated softly, never required (backward-compatible).
  if (
    data.identity.links !== undefined &&
    !Array.isArray(data.identity.links)
  ) {
    return { ok: false, error: 'identity.links must be an array.' }
  }

  if (!Array.isArray(data.skills)) {
    return { ok: false, error: 'Missing skills array.' }
  }
  if (!Array.isArray(data.education)) {
    return { ok: false, error: 'Missing education array.' }
  }
  if (!Array.isArray(data.projects)) {
    return { ok: false, error: 'Missing projects array.' }
  }
  if (!Array.isArray(data.experience)) {
    return { ok: false, error: 'Missing experience array.' }
  }
  if (!Array.isArray(data.languages)) {
    return { ok: false, error: 'Missing languages array.' }
  }

  // Soft-check experience bullets when present
  for (const item of data.experience) {
    if (!isRecord(item)) continue
    if (item.bullets !== undefined && !isStringArray(item.bullets)) {
      return { ok: false, error: 'experience[].bullets must be a string array.' }
    }
  }

  return { ok: true, cv: normalizeCvDocument(data as unknown as CvDocument) }
}

const storageKey = (dataset: string) => `cvstudio:${dataset}`

export function loadStoredCv(dataset: string): CvDocument | null {
  try {
    const raw = localStorage.getItem(storageKey(dataset))
    if (!raw) return null
    const parsed = parseCvJson(raw)
    return parsed.ok ? parsed.cv : null
  } catch {
    return null
  }
}

export function saveStoredCv(dataset: string, cv: CvDocument): void {
  localStorage.setItem(
    storageKey(dataset),
    JSON.stringify(normalizeCvDocument(cv)),
  )
}

/** Canonical pretty-printed JSON used for both file download and file-handle writes. */
export function serializeCv(cv: CvDocument): string {
  return JSON.stringify(normalizeCvDocument(cv), null, 2) + '\n'
}

export function downloadCvJson(filename: string, cv: CvDocument): void {
  const blob = new Blob([serializeCv(cv)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
