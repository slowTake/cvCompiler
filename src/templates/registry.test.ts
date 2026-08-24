import { describe, it, expect } from 'vitest'
import { getTemplate, listTemplates } from '@/templates/registry'
import { SKELETONS, getSkeleton } from '@/templates/skeletons'
import { isThemeId } from '@/templates/themes'
import { DEFAULT_TEMPLATE_ID, resolveTemplateId } from '@/types/cv'
import type { CvDocument } from '@/types/cv'

describe('template registry', () => {
  it('resolves the default template by id', () => {
    expect(getTemplate(DEFAULT_TEMPLATE_ID).id).toBe(DEFAULT_TEMPLATE_ID)
  })

  it('falls back to the default for unknown, empty, or whitespace ids', () => {
    expect(getTemplate('does-not-exist').id).toBe(DEFAULT_TEMPLATE_ID)
    expect(getTemplate(undefined).id).toBe(DEFAULT_TEMPLATE_ID)
    expect(getTemplate('   ').id).toBe(DEFAULT_TEMPLATE_ID)
  })

  it('every entry maps to a registered skeleton and a known theme', () => {
    for (const template of listTemplates()) {
      expect(SKELETONS[template.skeletonId]).toBeTypeOf('function')
      expect(isThemeId(template.themeId)).toBe(true)
    }
  })

  it('every entry has the fields the gallery renders (id, label)', () => {
    for (const template of listTemplates()) {
      expect(template.id.trim().length).toBeGreaterThan(0)
      expect(template.label.trim().length).toBeGreaterThan(0)
    }
  })

  it('exposes the seam: a second template reuses the sidebar skeleton', () => {
    const slate = getTemplate('slate')
    const studio = getTemplate('studio')
    expect(slate.skeletonId).toBe(studio.skeletonId)
    expect(slate.themeId).not.toBe(studio.themeId)
  })
})

describe('skeleton registry', () => {
  it('resolves a skeleton component for every registered id', () => {
    for (const id of Object.keys(SKELETONS) as (keyof typeof SKELETONS)[]) {
      expect(getSkeleton(id)).toBeTypeOf('function')
    }
  })
})

describe('resolveTemplateId', () => {
  it('returns the stored templateId when present', () => {
    const cv = { meta: { title: 'X', templateId: 'studio' } } as CvDocument
    expect(resolveTemplateId(cv)).toBe('studio')
  })

  it('defaults when templateId is blank', () => {
    const cv = { meta: { title: 'X', templateId: '  ' } } as CvDocument
    expect(resolveTemplateId(cv)).toBe(DEFAULT_TEMPLATE_ID)
  })
})
