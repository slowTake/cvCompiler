import type { ReactNode } from 'react'
import { ExternalLinkIcon } from '@/components/icons'

export function LinkedText({
  href,
  children,
  className,
}: {
  href?: string
  children: ReactNode
  className?: string
}) {
  if (!href) {
    return <span className={className}>{children}</span>
  }
  return (
    <a
      className={className ? `${className} cv-link` : 'cv-link'}
      href={href}
      target="_blank"
      rel="noreferrer"
    >
      <span>{children}</span>
      <ExternalLinkIcon className="cv-link__icon" />
    </a>
  )
}
