/**
 * Theme ids. Each MUST have a matching `[data-cv-theme='<id>']` token block in
 * index.css (studio is the base/default block on `.cv-preview-stack`).
 * Kept as a TS source of truth so the registry and tests can validate themeIds
 * without parsing CSS. Phase 5 grows this toward ~10.
 */
export const THEME_IDS = [
  'studio',
  'slate',
  'noir',
  'forest',
  'rose',
  'plain',
  'classic',
  'azure',
  'modern',
  'bold',
] as const

export type ThemeId = (typeof THEME_IDS)[number]

export function isThemeId(id: string): id is ThemeId {
  return (THEME_IDS as readonly string[]).includes(id)
}
