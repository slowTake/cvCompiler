export type Rgb = { r: number; g: number; b: number };

const HEX6 = /^#([0-9a-f]{6})$/i;
const HEX3 = /^#([0-9a-f]{3})$/i;

/** Normalises `#rgb` / `#rrggbb` (any case) to lowercase `#rrggbb`, or undefined. */
export function normalizeHex(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const v = value.trim();
  if (HEX6.test(v)) return v.toLowerCase();
  const short = HEX3.exec(v);
  if (short) {
    const [r, g, b] = short[1].toLowerCase();
    return `#${r}${r}${g}${g}${b}${b}`;
  }
  return undefined;
}

export function hexToRgb(hex: string): Rgb | undefined {
  const norm = normalizeHex(hex);
  if (!norm) return undefined;
  const n = Number.parseInt(norm.slice(1), 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

/**
 * Parses a computed CSS colour as returned by getComputedStyle:
 * `rgb(…)`, `rgba(…)` or `color(srgb r g b)`. Returns undefined otherwise.
 */
export function parseCssColor(value: string): Rgb | undefined {
  const v = value.trim();
  const hex = hexToRgb(v);
  if (hex) return hex;
  const rgb = /^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/i.exec(v);
  if (rgb) return { r: Number(rgb[1]), g: Number(rgb[2]), b: Number(rgb[3]) };
  const srgb = /^color\(\s*srgb\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)/i.exec(v);
  if (srgb) {
    return {
      r: Math.round(Number(srgb[1]) * 255),
      g: Math.round(Number(srgb[2]) * 255),
      b: Math.round(Number(srgb[3]) * 255),
    };
  }
  return undefined;
}

function channel(c: number): number {
  const s = c / 255;
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

/** WCAG 2.x relative luminance. */
export function luminance({ r, g, b }: Rgb): number {
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

/** WCAG contrast ratio, 1–21. */
export function contrastRatio(a: Rgb, b: Rgb): number {
  const la = luminance(a);
  const lb = luminance(b);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

export const MIN_ACCENT_CONTRAST = 3;
