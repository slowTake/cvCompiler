import { describe, it, expect } from 'vitest'
import publicSeed from '@data/cv.public.json'
import { DEFAULT_TEMPLATE_ID } from '@/types/cv'
import type { CvDocument } from '@/types/cv'
import { normalizeCvDocument, parseCvJson } from '@/lib/storage'

describe('parseCvJson', () => {
  it('accepts the public demo seed', () => {
    const result = parseCvJson(JSON.stringify(publicSeed))
    expect(result.ok).toBe(true)
  })

  it('rejects text that is not JSON', () => {
    const result = parseCvJson('{ not json')
    expect(result.ok).toBe(false)
  })

  it('rejects an object missing meta.title', () => {
    const result = parseCvJson(
      JSON.stringify({
        identity: { name: 'x' },
        skills: [],
        education: [],
        projects: [],
        experience: [],
        languages: [],
      }),
    )
    expect(result.ok).toBe(false)
  })
})

describe('normalizeCvDocument', () => {
  it('fills a default templateId when missing', () => {
    const doc = normalizeCvDocument({
      ...(publicSeed as CvDocument),
      meta: { title: 'X' },
    })
    expect(doc.meta.templateId).toBe(DEFAULT_TEMPLATE_ID)
  })

  it('round-trips a valid document through JSON without data loss', () => {
    const normalized = normalizeCvDocument(publicSeed as CvDocument)
    const roundTripped = parseCvJson(JSON.stringify(normalized))
    expect(roundTripped.ok).toBe(true)
    if (roundTripped.ok) {
      expect(roundTripped.cv).toEqual(normalized)
    }
  })
})
