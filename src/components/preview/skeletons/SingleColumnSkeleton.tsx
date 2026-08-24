import type { CvDocument } from '@/types/cv'
import { CvIcon } from '@/components/icons'
import { OrderedSections } from '@/components/preview/CvSections'

/**
 * Single-column skeleton: one flowing column in semantic section order — no
 * sidebar, no decorative multi-column layout — so it reads cleanly for ATS
 * parsers and copy-paste. Structure only; color/type come from the theme tokens.
 */
export function SingleColumnSkeleton({ cv }: { cv: CvDocument }) {
  return (
    <article className="cv-page cv-page--single">
      <header className="cv-single-head">
        <h1 className="cv-name">{cv.identity.name}</h1>
        <p className="cv-role">{cv.identity.role}</p>
        {cv.identity.tagline ? (
          <p className="cv-tagline">{cv.identity.tagline}</p>
        ) : null}
        <ul className="cv-single-contact">
          {cv.identity.contact.map((item) => (
            <li key={item.id}>
              <CvIcon name={item.icon ?? item.type} className="cv-contact__icon" />
              {item.href ? (
                <a href={item.href} target="_blank" rel="noreferrer">
                  {item.value}
                </a>
              ) : (
                <span>{item.value}</span>
              )}
            </li>
          ))}
        </ul>
        {cv.identity.links?.length ? (
          <ul className="cv-links">
            {cv.identity.links.map((link) => (
              <li key={link.id}>
                <a href={link.href} target="_blank" rel="noreferrer">
                  {link.label || link.href}
                </a>
              </li>
            ))}
          </ul>
        ) : null}
      </header>

      <OrderedSections cv={cv} />
    </article>
  )
}
