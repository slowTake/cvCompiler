import { describe, it, expect } from 'vitest'
import { getTemplate, listTemplates } from '@/templates/registry'
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

  it('every registry entry exposes a Preview component', () => {
    for (const template of listTemplates()) {
      expect(typeof template.Preview).toBe('function')
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
