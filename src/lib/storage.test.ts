import { describe, it, expect } from 'vitest'
import publicSeed from '@data/cv.public.json'
import { DEFAULT_TEMPLATE_ID } from '@/types/cv'
import type { CvDocument } from '@/types/cv'
import { normalizeCvDocument, parseCvJson, serializeCv } from '@/lib/storage'

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

describe('serializeCv (durable file write path)', () => {
  it('produces JSON that parses back to the normalized document', () => {
    const normalized = normalizeCvDocument(publicSeed as CvDocument)
    const text = serializeCv(normalized)
    expect(text.endsWith('\n')).toBe(true)
    const parsed = parseCvJson(text)
    expect(parsed.ok).toBe(true)
    if (parsed.ok) expect(parsed.cv).toEqual(normalized)
  })
})

describe('optional Phase 3 fields (tagline, links)', () => {
  it('imports a pre-Phase-3 document (no tagline/links) unchanged', () => {
    const result = parseCvJson(JSON.stringify(publicSeed))
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.cv.identity.tagline).toBeUndefined()
      expect(result.cv.identity.links).toBeUndefined()
    }
  })

  it('round-trips tagline and links without loss', () => {
    const seed = publicSeed as CvDocument
    const doc = normalizeCvDocument({
      ...seed,
      identity: {
        ...seed.identity,
        tagline: 'Builder of resilient systems',
        links: [{ id: 'l1', label: 'GitHub', href: 'https://github.com/x' }],
      },
    })
    const result = parseCvJson(JSON.stringify(doc))
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.cv.identity.tagline).toBe('Builder of resilient systems')
      expect(result.cv.identity.links).toEqual([
        { id: 'l1', label: 'GitHub', href: 'https://github.com/x' },
      ])
    }
  })

  it('rejects identity.links when it is not an array', () => {
    const seed = publicSeed as CvDocument
    const bad = JSON.stringify({
      ...seed,
      identity: { ...seed.identity, links: 'nope' },
    })
    expect(parseCvJson(bad).ok).toBe(false)
  })
})
