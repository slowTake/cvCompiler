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

export function removeAt<T>(list: readonly T[], index: number): T[] {
  return list.filter((_, i) => i !== index);
}

/** '' and whitespace-only become undefined, for optional text fields. */
export function optional(value: string): string | undefined {
  return value.trim() === '' ? undefined : value;
}
