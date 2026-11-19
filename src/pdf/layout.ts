/**
 * Positioned PDF text → lines in reading order.
 *
 * Browsers emit text in drawing order, not reading order, and split it
 * differently (Firefox one item per word in places, Chromium per run), so
 * this rebuilds lines from positions: find a column gutter, group items by
 * baseline, and split each line into segments wherever there is a wide gap
 * (a right-aligned date, the next skill chip).
 */
import { collapseLetterSpacing, type PdfContent, type PdfLink, type PdfPage, type PdfTextItem } from './content';
import { isEmbedUrl } from './embed';

export type Region = 'full' | 'side' | 'main';

/** A run of one style inside a segment ("Swedish" bold, then "Native"). */
export interface Span {
  text: string;
  font: string;
  size: number;
}

export interface Segment {
  text: string;
  spans: Span[];
  x: number;
  right: number;
  size: number;
  font: string;
  color?: string;
  /** Link target under this segment, if any. */
  href?: string;
}

export interface Line {
  text: string;
  segments: Segment[];
  x: number;
  right: number;
  /** Baseline from the top of the page. */
  y: number;
  page: number;
  region: Region;
  /** Size and font of the first segment, which sets the line's style. */
  size: number;
  font: string;
  color?: string;
}

export interface Layout {
  lines: Line[];
  /** The narrow column, when the first page has two. */
  sidebar?: { side: 'left' | 'right'; widthPercent: number };
}

/** Icon glyphs the renderer adds (the ↗ after links) and private-use icon fonts. */
const DECORATION = /^[↗→\u{E000}-\u{F8FF}\u{F0000}-\u{FFFFD}]+$/u;

function usable(item: PdfTextItem): boolean {
  return item.str.trim() !== '' && !DECORATION.test(item.str.trim());
}

/**
 * The x of a vertical gutter splitting the page into two text columns, or
 * null. Items that cross it (a full-width header) don't count against it.
 */
function findGutter(page: PdfPage, items: PdfTextItem[]): number | null {
  const w = Math.ceil(page.width);
  const cover = Array.from({ length: w + 1 }, () => 0);
  for (const it of items) {
    for (let x = Math.max(0, Math.floor(it.x)); x <= Math.min(w, Math.ceil(it.x + it.width)); x++) cover[x]++;
  }
  const limit = Math.max(1, Math.round(items.length * 0.03));
  let best: { from: number; to: number } | null = null;
  let start = -1;
  const lo = Math.round(page.width * 0.2);
  const hi = Math.round(page.width * 0.8);
  for (let x = lo; x <= hi + 1; x++) {
    const open = x <= hi && cover[x] <= limit;
    if (open && start < 0) start = x;
    if (!open && start >= 0) {
      if (!best || x - start > best.to - best.from) best = { from: start, to: x };
      start = -1;
    }
  }
  if (!best || best.to - best.from < 12) return null;
  const mid = (best.from + best.to) / 2;

  // Both sides need real content top to bottom, or it's just a gap between
  // a title and its right-aligned date.
  const side = (left: boolean) => items.filter((it) => (left ? it.x + it.width <= mid : it.x >= mid));
  for (const group of [side(true), side(false)]) {
    const chars = group.reduce((n, it) => n + it.str.length, 0);
    if (chars < 80) return null;
    const ys = group.map((it) => it.y);
    if (Math.max(...ys) - Math.min(...ys) < page.height * 0.3) return null;
  }
  return mid;
}

function linkAt(links: PdfLink[], x: number, right: number, y: number, size: number): string | undefined {
  const top = y - size;
  const bottom = y + size * 0.35;
  const hit = links.find(
    (l) => l.x < right && l.x + l.width > x && l.y < bottom && l.y + l.height > top && !isEmbedUrl(l.url),
  );
  return hit?.url;
}

/** Items on one baseline → segments, split at gaps wider than ~an em. */
function buildLine(items: PdfTextItem[], page: number, region: Region, links: PdfLink[]): Line {
  items.sort((a, b) => a.x - b.x);
  const segments: Segment[] = [];
  let cur: Segment | null = null;
  for (const it of items) {
    const text = collapseLetterSpacing(it.str).trim();
    const gap = cur ? it.x - cur.right : 0;
    if (cur && gap < it.size * 0.9) {
      const sep = gap > it.size * 0.12 && !cur.text.endsWith(' ') ? ' ' : '';
      cur.text += sep + text;
      cur.right = Math.max(cur.right, it.x + it.width);
      const span = cur.spans[cur.spans.length - 1];
      if (span.font === it.font && Math.abs(span.size - it.size) < 0.25) span.text += sep + text;
      else cur.spans.push({ text, font: it.font, size: it.size });
    } else {
      cur = {
        text,
        spans: [{ text, font: it.font, size: it.size }],
        x: it.x,
        right: it.x + it.width,
        size: it.size,
        font: it.font,
        color: it.color,
      };
      segments.push(cur);
    }
  }
  for (const seg of segments) {
    seg.text = seg.text.replace(/\s+/g, ' ').trim();
    for (const span of seg.spans) span.text = span.text.replace(/\s+/g, ' ').trim();
    seg.href = linkAt(links, seg.x, seg.right, items[0].y, seg.size);
  }
  const first = segments[0];
  return {
    text: segments.map((s) => s.text).join(' '),
    segments,
    x: first.x,
    right: Math.max(...segments.map((s) => s.right)),
    y: items.reduce((n, it) => n + it.y, 0) / items.length,
    page,
    region,
    size: first.size,
    font: first.font,
    color: first.color,
  };
}

function toLines(items: PdfTextItem[], page: number, region: Region, links: PdfLink[]): Line[] {
  const sorted = [...items].sort((a, b) => a.y - b.y || a.x - b.x);
  const rows: PdfTextItem[][] = [];
  for (const it of sorted) {
    const row = rows[rows.length - 1];
    if (row && Math.abs(row[0].y - it.y) <= Math.max(row[0].size, it.size) * 0.35) row.push(it);
    else rows.push([it]);
  }
  return rows.map((row) => buildLine(row, page, region, links));
}

export function buildLayout(content: PdfContent): Layout {
  const lines: Line[] = [];
  let sidebar: Layout['sidebar'];
  // The first page decides the layout; later pages reuse its gutter, since a
  // short last page may not show two columns clearly.
  let pageOneGutter: number | null | undefined;

  content.pages.forEach((page, index) => {
    const items = page.items.filter(usable);
    if (items.length === 0) return;
    if (pageOneGutter === undefined) pageOneGutter = findGutter(page, items);
    const gutter = pageOneGutter;
    if (gutter === null) {
      lines.push(...toLines(items, index, 'full', page.links));
      return;
    }

    const left = items.filter((it) => it.x + it.width <= gutter);
    const right = items.filter((it) => it.x >= gutter);
    const crossing = items.filter((it) => it.x < gutter && it.x + it.width > gutter);
    const leftNarrow = gutter < page.width / 2;
    if (index === 0) {
      sidebar = {
        side: leftNarrow ? 'left' : 'right',
        widthPercent: Math.round(((leftNarrow ? gutter : page.width - gutter) / page.width) * 100),
      };
    }

    // Full-width lines above both columns (a header band) come first.
    const top = Math.min(...[...left, ...right].map((it) => it.y));
    const above = crossing.filter((it) => it.y < top);
    const rest = crossing.filter((it) => it.y >= top);
    lines.push(...toLines(above, index, 'full', page.links));
    lines.push(...toLines(left, index, leftNarrow ? 'side' : 'main', page.links));
    lines.push(...toLines(right, index, leftNarrow ? 'main' : 'side', page.links));
    lines.push(...toLines(rest, index, 'full', page.links));
  });

  return { lines, sidebar };
}
