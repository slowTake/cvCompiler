/**
 * An entry description is plain text that mixes paragraphs and bullet points:
 * a line starting with "-", "*" or "•" is a bullet; other lines are paragraph
 * text, and a blank line starts a new paragraph. Line breaks inside a
 * paragraph are kept.
 */
export type DescriptionBlock = { kind: 'paragraph'; text: string } | { kind: 'bullets'; items: string[] };

const BULLET = /^\s*[-*•]\s+/;

export function parseDescription(text: string | undefined): DescriptionBlock[] {
  const blocks: DescriptionBlock[] = [];
  let paragraph: string[] = [];
  let bullets: string[] = [];

  const flushParagraph = () => {
    if (paragraph.length > 0) blocks.push({ kind: 'paragraph', text: paragraph.join('\n') });
    paragraph = [];
  };
  const flushBullets = () => {
    if (bullets.length > 0) blocks.push({ kind: 'bullets', items: bullets });
    bullets = [];
  };

  for (const raw of (text ?? '').split(/\r?\n/)) {
    const line = raw.trim();
    if (line === '') {
      flushParagraph();
      flushBullets();
    } else if (BULLET.test(raw)) {
      flushParagraph();
      const item = raw.replace(BULLET, '').trim();
      if (item) bullets.push(item);
    } else {
      flushBullets();
      paragraph.push(line);
    }
  }
  flushParagraph();
  flushBullets();
  return blocks;
}

/** Builds a description from the old separate summary + bullets fields. */
export function descriptionFrom(summary: string | undefined, bullets: readonly string[] | undefined): string {
  const parts: string[] = [];
  if (summary?.trim()) parts.push(summary.trim());
  const items = (bullets ?? []).map((b) => b.trim()).filter(Boolean);
  if (items.length > 0) parts.push(items.map((b) => `- ${b}`).join('\n'));
  return parts.join('\n\n');
}
