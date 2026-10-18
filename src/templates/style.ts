import type { CSSProperties } from 'react'
import type { CvStyle, Density, FontPairing, HeaderCase } from '@/types/cv'

/**
 * StyleOverrides (ADR 0007): user tweaks layered over the active Theme. Every
 * field is optional; absent = the template's own token value. This module owns
 * the allowed values, sanitising, and the mapping to `--cv-*` tokens.
 */

export const TYPE_SCALE_MIN = 80
export const TYPE_SCALE_MAX = 145
export const TYPE_SCALE_DEFAULT = 100

export const SIDEBAR_WIDTH_MIN = 30
export const SIDEBAR_WIDTH_MAX = 50
export const SIDEBAR_WIDTH_DEFAULT = 40

export const FONT_PAIRINGS: { id: FontPairing; label: string; hint: string }[] = [
  { id: 'mono', label: 'Mono', hint: 'Monospace throughout' },
  { id: 'sans', label: 'Sans', hint: 'Clean sans-serif' },
  { id: 'serif', label: 'Serif', hint: 'Traditional serif' },
  { id: 'editorial', label: 'Editorial', hint: 'Serif headings, sans body' },
  { id: 'technical', label: 'Technical', hint: 'Mono headings, sans body' },
]

/** Body / heading `--cv-stack-*` suffix per pairing (also drives the Design tab samples). */
export const FONT_STACKS: Record<FontPairing, { body: string; heading: string }> = {
  mono: { body: 'mono', heading: 'mono' },
  sans: { body: 'sans', heading: 'sans' },
  serif: { body: 'serif', heading: 'serif' },
  editorial: { body: 'sans', heading: 'serif' },
  technical: { body: 'sans', heading: 'mono' },
}

export const DENSITIES: { id: Density; label: string; factor: number }[] = [
  { id: 'compact', label: 'Compact', factor: 0.8 },
  { id: 'normal', label: 'Normal', factor: 1 },
  { id: 'roomy', label: 'Roomy', factor: 1.2 },
]

export const HEADER_CASES: { id: HeaderCase; label: string }[] = [
  { id: 'upper', label: 'UPPERCASE' },
  { id: 'normal', label: 'Normal case' },
]

/** Curated accent swatches offered next to the template default + custom picker. */
export const ACCENT_PRESETS = [
  '#d47a96',
  '#b04a63',
  '#c8871d',
  '#2f6b4f',
  '#0f7a6e',
  '#2166a8',
  '#5b4bb7',
  '#475569',
  '#111827',
]

const HEX_RE = /^#[0-9a-f]{6}$/i

function clampInt(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, Math.round(value)))
}

function pick<T extends string>(value: unknown, allowed: readonly T[]): T | undefined {
  return typeof value === 'string' && (allowed as readonly string[]).includes(value)
    ? (value as T)
    : undefined
}

/**
 * Keep only valid override values; drop unknown keys and malformed values.
 * Returns `undefined` when nothing survives, so an empty `meta.style` never
 * gets written into the document.
 */
export function normalizeCvStyle(input: unknown): CvStyle | undefined {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) {
    return undefined
  }
  const raw = input as Record<string, unknown>
  const style: CvStyle = {}

  if (typeof raw.accent === 'string' && HEX_RE.test(raw.accent)) {
    style.accent = raw.accent.toLowerCase()
  }
  const fontPairing = pick(raw.fontPairing, FONT_PAIRINGS.map((f) => f.id))
  if (fontPairing) style.fontPairing = fontPairing
  const density = pick(raw.density, DENSITIES.map((d) => d.id))
  if (density) style.density = density
  const headerCase = pick(raw.headerCase, HEADER_CASES.map((h) => h.id))
  if (headerCase) style.headerCase = headerCase
  if (typeof raw.sidebarWidth === 'number' && Number.isFinite(raw.sidebarWidth)) {
    style.sidebarWidth = clampInt(raw.sidebarWidth, SIDEBAR_WIDTH_MIN, SIDEBAR_WIDTH_MAX)
  }
  if (typeof raw.typeScale === 'number' && Number.isFinite(raw.typeScale)) {
    const scale = clampInt(raw.typeScale, TYPE_SCALE_MIN, TYPE_SCALE_MAX)
    if (scale !== TYPE_SCALE_DEFAULT) style.typeScale = scale
  }

  return Object.keys(style).length ? style : undefined
}

/** True when any visual override (everything except type size) is set. */
export function hasDesignOverrides(style: CvStyle | undefined): boolean {
  if (!style) return false
  return Object.keys(style).some((key) => key !== 'typeScale')
}

/**
 * Map overrides to inline `--cv-*` tokens + `data-*` hooks for the preview root.
 * Derived accent colors are computed in CSS (`[data-cv-accent='custom']`), so
 * only the base hex travels inline.
 */
export function styleToPreviewProps(style: CvStyle | undefined): {
  style: CSSProperties
  attrs: Record<string, string>
} {
  const vars: Record<string, string> = {
    '--cv-scale': String((style?.typeScale ?? TYPE_SCALE_DEFAULT) / 100),
  }
  const attrs: Record<string, string> = {}

  if (style?.accent) {
    vars['--cv-custom-accent'] = style.accent
    attrs['data-cv-accent'] = 'custom'
  }
  if (style?.fontPairing) {
    const { body, heading } = FONT_STACKS[style.fontPairing]
    vars['--cv-font-body'] = `var(--cv-stack-${body})`
    vars['--cv-font-heading'] = `var(--cv-stack-${heading})`
  }
  if (style?.density) {
    const factor = DENSITIES.find((d) => d.id === style.density)?.factor ?? 1
    vars['--cv-density'] = String(factor)
  }
  if (style?.headerCase) {
    vars['--cv-header-transform'] = style.headerCase === 'upper' ? 'uppercase' : 'none'
  }
  if (style?.sidebarWidth !== undefined) {
    vars['--cv-sidebar-width'] = `${style.sidebarWidth}%`
  }

  return { style: vars as CSSProperties, attrs }
}

/** WCAG relative luminance of a `#rrggbb` color. */
function luminance(hex: string): number {
  const channels = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
  const [r, g, b] = channels.map((c) =>
    c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4,
  )
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/** WCAG contrast ratio between two `#rrggbb` colors (1–21). */
export function contrastRatio(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

/**
 * Accents color icons, links and rules on near-white paper; below 3:1 (the
 * WCAG threshold for graphics and large text) they start to wash out.
 */
export const ACCENT_MIN_CONTRAST = 3
