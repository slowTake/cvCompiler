/**
 * Picks the closest template for a parsed PDF: the skeleton from the layout
 * (two columns, a light name on a coloured band, or one column), then the
 * template in that skeleton whose accent hue is nearest the PDF's.
 */
import { SIDEBAR_WIDTH_RANGE, type StyleOverrides } from '../model/types';
import { TEMPLATES, type TemplateDef } from '../templates/registry';
import type { SkeletonId } from '../templates/skeletons';
import type { Layout, Line } from './layout';

interface Hsl {
  h: number;
  s: number;
  l: number;
}

function hsl(hex: string): Hsl {
  const n = parseInt(hex.slice(1), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => v / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  if (d === 0) return { h: 0, s: 0, l };
  const s = d / (1 - Math.abs(2 * l - 1));
  const h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return { h: (h * 60 + 360) % 360, s, l };
}

const hueGap = (a: number, b: number) => Math.min(Math.abs(a - b), 360 - Math.abs(a - b));
const isColourful = (c: Hsl) => c.s > 0.15 && c.l > 0.2 && c.l < 0.85;

/** The most-used colourful text colour, by characters. */
function accentOf(lines: Line[]): string | null {
  const chars = new Map<string, number>();
  for (const l of lines) {
    for (const s of l.segments) {
      if (s.color && isColourful(hsl(s.color))) chars.set(s.color, (chars.get(s.color) ?? 0) + s.text.length);
    }
  }
  return [...chars.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
}

export function guessTemplate(
  lines: Line[],
  sidebar: Layout['sidebar'],
  nameLine: Line | undefined,
): { templateId: string; style?: StyleOverrides; reason: string } {
  const lightName = !!nameLine?.color && hsl(nameLine.color).l > 0.75;
  const skeleton: SkeletonId = sidebar ? 'sidebar' : lightName ? 'header-band' : 'single';
  const accent = accentOf(lines);
  const accentHsl = accent ? hsl(accent) : null;

  let candidates = TEMPLATES.filter((t) => t.skeleton === skeleton);
  // Light text in a sidebar means a dark sidebar.
  if (skeleton === 'sidebar' && lightName) candidates = candidates.filter((t) => t.id === 'nocturne');
  const score = (t: TemplateDef) => {
    const c = hsl(t.defaults.accent);
    if (!accentHsl) return c.s; // No accent colour: the plainest template wins.
    return isColourful(c) ? hueGap(c.h, accentHsl.h) : 180;
  };
  const template = [...candidates].sort((a, b) => score(a) - score(b))[0];

  const style: StyleOverrides = {};
  if (accent && accentHsl && hueGap(hsl(template.defaults.accent).h, accentHsl.h) > 25) style.accent = accent;
  if (sidebar && Math.abs(sidebar.widthPercent - template.defaults.sidebarWidth) >= 3) {
    style.sidebarWidth = Math.min(SIDEBAR_WIDTH_RANGE.max, Math.max(SIDEBAR_WIDTH_RANGE.min, sidebar.widthPercent));
  }

  const layout =
    skeleton === 'sidebar'
      ? `two columns with a ${sidebar!.side} sidebar`
      : skeleton === 'header-band'
        ? 'a coloured header band'
        : 'a single column';
  const colour = accent ? (style.accent ? `, using the PDF's accent ${accent}` : ', with a similar accent colour') : '';
  return {
    templateId: template.id,
    style: Object.keys(style).length ? style : undefined,
    reason: `The PDF has ${layout}, so ${template.name} is the closest match${colour}.`,
  };
}
