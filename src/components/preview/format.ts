/** Shared preview formatting helpers (used by all skeletons). */
export function formatRange(start?: string, end?: string): string {
  if (!start && !end) return ''
  if (start && end) return `${start} — ${end}`
  return start || end || ''
}
