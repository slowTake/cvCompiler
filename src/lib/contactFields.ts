import type { ContactItem } from '@/types/cv'

export type ContactType = ContactItem['type']

type ContactTypeDefaults = {
  label: string
  icon: string
  valuePlaceholder: string
}

export const CONTACT_TYPE_DEFAULTS: Record<ContactType, ContactTypeDefaults> = {
  email: {
    label: 'Email',
    icon: 'mail',
    valuePlaceholder: 'you@example.com',
  },
  phone: {
    label: 'Phone',
    icon: 'phone',
    valuePlaceholder: '+1 555 010 2048',
  },
  location: {
    label: 'Location',
    icon: 'map-pin',
    valuePlaceholder: 'City, Country',
  },
  link: {
    label: 'Link',
    icon: 'globe',
    valuePlaceholder: 'github.com/you',
  },
}

export function isLinkContact(type: ContactType): boolean {
  return type === 'link'
}

/** Build href for email/phone; clear for location; undefined means "leave unchanged" for link. */
export function deriveContactHref(
  type: ContactType,
  value: string,
): string | undefined {
  const trimmed = value.trim()
  if (type === 'location') return undefined
  if (type === 'link') return undefined
  if (!trimmed) return undefined

  if (type === 'email') {
    const address = trimmed.replace(/^mailto:/i, '')
    return address ? `mailto:${address}` : undefined
  }

  // phone
  const raw = trimmed.replace(/^tel:/i, '')
  const normalized = raw.replace(/[^\d+]/g, '')
  return normalized ? `tel:${normalized}` : undefined
}

export function applyContactTypeChange(
  item: ContactItem,
  type: ContactType,
): ContactItem {
  const defaults = CONTACT_TYPE_DEFAULTS[type]
  const next: ContactItem = {
    ...item,
    type,
    label: defaults.label,
    icon: defaults.icon,
  }

  if (type === 'link') {
    // URL is user-owned for link rows; start clean on type change.
    delete next.href
    return next
  }

  const href = deriveContactHref(type, item.value)
  if (href) next.href = href
  else delete next.href
  return next
}

export function applyContactValueChange(
  item: ContactItem,
  value: string,
): ContactItem {
  const next: ContactItem = { ...item, value }

  if (item.type === 'link') {
    return next
  }

  const href = deriveContactHref(item.type, value)
  if (href) next.href = href
  else delete next.href

  // Keep derived label in sync for non-link types.
  next.label = CONTACT_TYPE_DEFAULTS[item.type].label
  return next
}

export function createBlankContact(id: string): ContactItem {
  const defaults = CONTACT_TYPE_DEFAULTS.email
  return {
    id,
    type: 'email',
    label: defaults.label,
    value: '',
    icon: defaults.icon,
  }
}
