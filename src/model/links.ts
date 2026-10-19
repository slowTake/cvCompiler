import type { ContactItem } from './types';

const SAFE_SCHEME = /^(https?:|mailto:|tel:)/i;
const ANY_SCHEME = /^[a-z][a-z0-9+.-]*:/i;
const DOMAIN_LIKE = /^[^\s/@]+\.[^\s/@]{2,}(\/\S*)?$/;

/**
 * Returns a link target that is safe to put in an <a href>, or undefined.
 * Allows http(s), mailto and tel; bare domains such as `example.com/me`
 * become https links; every other scheme (javascript:, data:, …) is refused.
 */
export function safeHref(raw: string | undefined): string | undefined {
  const value = raw?.trim();
  if (!value) return undefined;
  if (SAFE_SCHEME.test(value)) return value;
  if (ANY_SCHEME.test(value)) return undefined;
  if (DOMAIN_LIKE.test(value)) return `https://${value}`;
  return undefined;
}

export function contactHref(item: ContactItem): string | undefined {
  if (item.href) return safeHref(item.href);
  const value = item.value.trim();
  if (!value) return undefined;
  switch (item.kind) {
    case 'email':
      return value.includes('@') && !/\s/.test(value) ? `mailto:${value}` : undefined;
    case 'phone': {
      const digits = value.replace(/[^\d+]/g, '');
      return digits.length >= 5 ? `tel:${digits}` : undefined;
    }
    case 'location':
      return undefined;
    default:
      return safeHref(value);
  }
}
