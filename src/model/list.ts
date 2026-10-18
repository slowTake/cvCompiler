/** Returns a copy of `list` with the item at `index` moved by `delta` (clamped). */
export function moveItem<T>(list: readonly T[], index: number, delta: number): T[] {
  const target = Math.min(list.length - 1, Math.max(0, index + delta));
  if (index < 0 || index >= list.length || target === index) return [...list];
  const next = [...list];
  const [item] = next.splice(index, 1);
  next.splice(target, 0, item);
  return next;
}

export function replaceAt<T>(list: readonly T[], index: number, item: T): T[] {
  return list.map((existing, i) => (i === index ? item : existing));
}

/** Inserts `item` at `index`, clamped to the list bounds. */
export function insertAt<T>(list: readonly T[], index: number, item: T): T[] {
  const at = Math.min(list.length, Math.max(0, index));
  return [...list.slice(0, at), item, ...list.slice(at)];
}

export function removeAt<T>(list: readonly T[], index: number): T[] {
  return list.filter((_, i) => i !== index);
}

/** '' and whitespace-only become undefined, for optional text fields. */
export function optional(value: string): string | undefined {
  return value.trim() === '' ? undefined : value;
}

/** Splits typed or pasted tag text on commas and newlines. */
export function splitTags(text: string): string[] {
  return text
    .split(/[,\r\n]+/)
    .map((t) => t.trim())
    .filter(Boolean);
}

/**
 * Applies a tag input's draft to its list. While editing tag `editing`, the
 * draft replaces it as one tag, commas included (an empty draft removes it).
 * Otherwise the draft is split into new tags appended at the end. Existing
 * tags are never re-split, so imported tags containing commas survive.
 */
export function applyTagDraft(
  tags: readonly string[],
  draft: string,
  editing: number | null,
): string[] {
  if (editing !== null && editing >= 0 && editing < tags.length) {
    const text = draft.trim();
    return text ? replaceAt(tags, editing, text) : removeAt(tags, editing);
  }
  return [...tags, ...splitTags(draft)];
}
