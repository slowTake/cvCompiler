import { describe, it, expect } from 'vitest'
import publicSeed from '@data/cv.public.json'
import type { CvDocument } from '@/types/cv'
import {
  applyLegacyTypeScale,
  normalizeCvDocument,
  parseCvJson,
} from '@/lib/storage'
import {
  contrastRatio,
  hasDesignOverrides,
  normalizeCvStyle,
  styleToPreviewProps,
} from '@/templates/style'

const seed = publicSeed as CvDocument

describe('normalizeCvStyle', () => {
  it('keeps valid overrides', () => {
    expect(
      normalizeCvStyle({
        accent: '#2166A8',
        fontPairing: 'editorial',
        density: 'compact',
        headerCase: 'normal',
        sidebarWidth: 35,
        typeScale: 110,
      }),
    ).toEqual({
      accent: '#2166a8',
      fontPairing: 'editorial',
      density: 'compact',
      headerCase: 'normal',
      sidebarWidth: 35,
      typeScale: 110,
    })
  })

  it('drops malformed values and unknown keys', () => {
    expect(
      normalizeCvStyle({
        accent: 'red',
        fontPairing: 'comic',
        density: 3,
        headerCase: 'title',
        css: 'body { display: none }',
      }),
    ).toBeUndefined()
  })

  it('clamps numeric ranges', () => {
    expect(normalizeCvStyle({ sidebarWidth: 90, typeScale: 10 })).toEqual({
      sidebarWidth: 50,
      typeScale: 80,
    })
  })

  it('omits the default type scale and empty objects', () => {
    expect(normalizeCvStyle({ typeScale: 100 })).toBeUndefined()
    expect(normalizeCvStyle({})).toBeUndefined()
    expect(normalizeCvStyle(null)).toBeUndefined()
    expect(normalizeCvStyle([])).toBeUndefined()
  })
})

describe('meta.style in documents', () => {
  it('leaves a document without overrides unchanged', () => {
    const doc = normalizeCvDocument(structuredClone(seed))
    expect('style' in doc.meta).toBe(false)
  })

  it('round-trips overrides through parseCvJson', () => {
    const style = { accent: '#0f7a6e', density: 'roomy' as const }
    const result = parseCvJson(
      JSON.stringify({ ...seed, meta: { ...seed.meta, style } }),
    )
    expect(result.ok && result.cv.meta.style).toEqual(style)
  })

  it('imports files with invalid overrides instead of rejecting them', () => {
    const result = parseCvJson(
      JSON.stringify({ ...seed, meta: { ...seed.meta, style: 'loud' } }),
    )
    expect(result.ok).toBe(true)
    expect(result.ok && result.cv.meta.style).toBeUndefined()
  })
})

describe('applyLegacyTypeScale', () => {
  it('moves a stored per-browser type size into the document', () => {
    const doc = applyLegacyTypeScale(structuredClone(seed), '120')
    expect(doc.meta.style?.typeScale).toBe(120)
  })

  it('never overwrites a type size the document already has', () => {
    const withScale = normalizeCvDocument({
      ...seed,
      meta: { ...seed.meta, style: { typeScale: 90 } },
    })
    expect(applyLegacyTypeScale(withScale, '120').meta.style?.typeScale).toBe(90)
  })

  it('ignores missing or junk values', () => {
    const doc = structuredClone(seed)
    expect(applyLegacyTypeScale(doc, null)).toBe(doc)
    expect(applyLegacyTypeScale(doc, 'big')).toBe(doc)
  })
})

describe('styleToPreviewProps', () => {
  it('emits only the scale token when there are no overrides', () => {
    const { style, attrs } = styleToPreviewProps(undefined)
    expect(style).toEqual({ '--cv-scale': '1' })
    expect(attrs).toEqual({})
  })

  it('maps every override to a --cv-* token', () => {
    const { style, attrs } = styleToPreviewProps({
      accent: '#123456',
      fontPairing: 'technical',
      density: 'compact',
      headerCase: 'normal',
      sidebarWidth: 33,
      typeScale: 90,
    })
    expect(attrs).toEqual({ 'data-cv-accent': 'custom' })
    expect(style).toEqual({
      '--cv-scale': '0.9',
      '--cv-custom-accent': '#123456',
      '--cv-font-body': 'var(--cv-stack-sans)',
      '--cv-font-heading': 'var(--cv-stack-mono)',
      '--cv-density': '0.8',
      '--cv-header-transform': 'none',
      '--cv-sidebar-width': '33%',
    })
  })
})

describe('helpers', () => {
  it('treats type size alone as no design override', () => {
    expect(hasDesignOverrides({ typeScale: 110 })).toBe(false)
    expect(hasDesignOverrides({ density: 'roomy' })).toBe(true)
  })

  it('computes WCAG contrast', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 0)
    expect(contrastRatio('#ffffff', '#ffffff')).toBeCloseTo(1, 5)
  })
})
