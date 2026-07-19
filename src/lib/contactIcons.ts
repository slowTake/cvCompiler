/** Canonical icon ids offered in the contact form dropdown. */
export const CONTACT_ICON_OPTIONS = [
  { value: 'mail', label: 'Mail' },
  { value: 'phone', label: 'Phone' },
  { value: 'map-pin', label: 'Location' },
  { value: 'github', label: 'GitHub' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'globe', label: 'Website' },
  { value: 'link', label: 'Link' },
  { value: 'user', label: 'Person' },
] as const

export type ContactIconValue = (typeof CONTACT_ICON_OPTIONS)[number]['value']

export const CONTACT_ICON_ALIASES: Record<string, string> = {
  email: 'mail',
  location: 'map-pin',
}

const KNOWN_CONTACT_ICONS = new Set<string>(
  CONTACT_ICON_OPTIONS.map((option) => option.value),
)

export function resolveContactIcon(icon?: string): string {
  if (!icon) return 'globe'
  return CONTACT_ICON_ALIASES[icon] ?? icon
}

export function isKnownContactIcon(icon?: string): boolean {
  return KNOWN_CONTACT_ICONS.has(resolveContactIcon(icon))
}
