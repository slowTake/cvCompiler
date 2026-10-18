import { normalizeHex } from './color';
import {
  DENSITIES,
  FONT_PAIRINGS,
  HEADER_CASES,
  SIDEBAR_WIDTH_RANGE,
  TYPE_SCALE_RANGE,
  type Density,
  type FontPairing,
  type HeaderCase,
  type StyleOverrides,
} from './types';

/** Every override knob, fully resolved. Templates declare these as defaults. */
export type ResolvedStyle = Required<StyleOverrides>;

export const STYLE_KEYS = [
  'accent',
  'fontPairing',
  'density',
  'headerCase',
  'sidebarWidth',
  'typeScale',
] as const satisfies readonly (keyof StyleOverrides)[];

function oneOf<T extends string>(options: readonly T[], value: unknown): T | undefined {
  return typeof value === 'string' && (options as readonly string[]).includes(value)
    ? (value as T)
    : undefined;
}

function clampedInt(value: unknown, range: { min: number; max: number }): number | undefined {
  if (typeof value !== 'number' || !Number.isFinite(value)) return undefined;
  return Math.min(range.max, Math.max(range.min, Math.round(value)));
}

/**
 * Turns untrusted input into a valid StyleOverrides object. Invalid values are
 * dropped (meaning "template default"); numbers outside their range are clamped.
 * Returns undefined when nothing valid remains.
 */
export function sanitizeStyle(input: unknown): StyleOverrides | undefined {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return undefined;
  const raw = input as Record<string, unknown>;
  const out: StyleOverrides = {};

  const accent = normalizeHex(raw.accent);
  if (accent) out.accent = accent;
  const fontPairing = oneOf<FontPairing>(FONT_PAIRINGS, raw.fontPairing);
  if (fontPairing) out.fontPairing = fontPairing;
  const density = oneOf<Density>(DENSITIES, raw.density);
  if (density) out.density = density;
  const headerCase = oneOf<HeaderCase>(HEADER_CASES, raw.headerCase);
  if (headerCase) out.headerCase = headerCase;
  const sidebarWidth = clampedInt(raw.sidebarWidth, SIDEBAR_WIDTH_RANGE);
  if (sidebarWidth !== undefined) out.sidebarWidth = sidebarWidth;
  const typeScale = clampedInt(raw.typeScale, TYPE_SCALE_RANGE);
  if (typeScale !== undefined) out.typeScale = typeScale;

  return Object.keys(out).length > 0 ? out : undefined;
}

export function resolveStyle(defaults: ResolvedStyle, overrides?: StyleOverrides): ResolvedStyle {
  const clean = sanitizeStyle(overrides) ?? {};
  return { ...defaults, ...clean };
}

/** Sets or clears one override; returns undefined when no overrides remain. */
export function setOverride<K extends keyof StyleOverrides>(
  current: StyleOverrides | undefined,
  key: K,
  value: StyleOverrides[K] | undefined,
): StyleOverrides | undefined {
  const next: StyleOverrides = { ...current };
  if (value === undefined) delete next[key];
  else next[key] = value;
  return sanitizeStyle(next);
}

const MONO =
  'ui-monospace, "SF Mono", SFMono-Regular, "Cascadia Mono", "Segoe UI Mono", "Roboto Mono", Menlo, Consolas, "Liberation Mono", "DejaVu Sans Mono", monospace';
const SANS =
  'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", "Noto Sans", "Liberation Sans", Arial, sans-serif';
const SERIF =
  'Charter, "Bitstream Charter", "Iowan Old Style", "Palatino Linotype", Palatino, "Book Antiqua", Georgia, "Noto Serif", "DejaVu Serif", serif';

/** Monospace runs wide; shrink it a touch so line lengths stay comparable. */
const MONO_FACTOR = 0.9;

export const FONT_PAIRING_STACKS: Record<
  FontPairing,
  { heading: string; body: string; bodyFactor: number; label: string }
> = {
  mono: { heading: MONO, body: MONO, bodyFactor: MONO_FACTOR, label: 'Mono' },
  sans: { heading: SANS, body: SANS, bodyFactor: 1, label: 'Sans' },
  serif: { heading: SERIF, body: SERIF, bodyFactor: 1.04, label: 'Serif' },
  editorial: { heading: SERIF, body: SANS, bodyFactor: 1, label: 'Editorial (serif + sans)' },
  technical: { heading: MONO, body: SANS, bodyFactor: 1, label: 'Technical (mono + sans)' },
};

const DENSITY_FACTOR: Record<Density, number> = { compact: 0.7, normal: 1, roomy: 1.35 };

/** The inline `--cv-*` custom properties that apply a resolved style to the CV root. */
export function styleToCssVars(style: ResolvedStyle): Record<string, string> {
  const fonts = FONT_PAIRING_STACKS[style.fontPairing];
  const upper = style.headerCase === 'upper';
  return {
    '--cv-accent': style.accent,
    '--cv-font-heading': fonts.heading,
    '--cv-font-body': fonts.body,
    '--cv-font-factor': String(fonts.bodyFactor),
    '--cv-density': String(DENSITY_FACTOR[style.density]),
    '--cv-heading-transform': upper ? 'uppercase' : 'none',
    '--cv-heading-tracking': upper ? '0.12em' : '0.01em',
    '--cv-sidebar-width': `${style.sidebarWidth}%`,
    '--cv-type-scale': String(style.typeScale / 100),
  };
}
