/**
 * Inline formatting inside CV text: `**words**` is bold, as in Markdown.
 * A `**` without a partner, or with nothing between, stays as typed.
 */
export interface InlineSpan {
  text: string;
  bold: boolean;
}

const BOLD = /\*\*(?=\S)(.+?)(?<=\S)\*\*/gs;

export function parseInline(text: string): InlineSpan[] {
  const spans: InlineSpan[] = [];
  let last = 0;
  for (const match of text.matchAll(BOLD)) {
    if (match.index > last) spans.push({ text: text.slice(last, match.index), bold: false });
    spans.push({ text: match[1], bold: true });
    last = match.index + match[0].length;
  }
  if (last < text.length) spans.push({ text: text.slice(last), bold: false });
  return spans;
}

/** Replace text[from, to) with `insert`, then select [selStart, selEnd). */
export interface TextEdit {
  from: number;
  to: number;
  insert: string;
  selStart: number;
  selEnd: number;
}

/** Bolds the selection text[start, end), or unbolds it if it is already wrapped in `**`. */
export function toggleBold(text: string, start: number, end: number): TextEdit {
  const selected = text.slice(start, end);
  if (selected.length >= 4 && selected.startsWith('**') && selected.endsWith('**')) {
    const inner = selected.slice(2, -2);
    return { from: start, to: end, insert: inner, selStart: start, selEnd: start + inner.length };
  }
  if (text.slice(start - 2, start) === '**' && text.slice(end, end + 2) === '**') {
    return { from: start - 2, to: end + 2, insert: selected, selStart: start - 2, selEnd: end - 2 };
  }
  // Keep surrounding spaces outside the markers: "**word**", never "**word **".
  const s = start + (selected.length - selected.trimStart().length);
  const e = Math.max(s, end - (selected.length - selected.trimEnd().length));
  return { from: s, to: e, insert: `**${text.slice(s, e)}**`, selStart: s + 2, selEnd: e + 2 };
}

/** Applies an edit to a string (the non-DOM path, and for tests). */
export function applyEdit(text: string, edit: TextEdit): string {
  return text.slice(0, edit.from) + edit.insert + text.slice(edit.to);
}
