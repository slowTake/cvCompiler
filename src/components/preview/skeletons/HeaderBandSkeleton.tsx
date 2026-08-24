import type { CvDocument } from '@/types/cv'
import { OrderedSections } from '@/components/preview/CvSections'

/**
 * Header-band skeleton: a full-width colored band (name, role, tagline, inline
 * contact) over a single stacked body. Distinct from `sidebar` (no rail) and
 * `single` (plain header). Band colors come from `--cv-band-*` theme tokens.
 */
export function HeaderBandSkeleton({ cv }: { cv: CvDocument }) {
  return (
    <article className="cv-page cv-page--band">
      <header className="cv-band">
        <h1 className="cv-band__name">{cv.identity.name}</h1>
        <p className="cv-band__role">{cv.identity.role}</p>
        {cv.identity.tagline ? (
          <p className="cv-band__tagline">{cv.identity.tagline}</p>
        ) : null}
        <ul className="cv-band__contact">
          {cv.identity.contact.map((item) => (
            <li key={item.id}>
              {item.href ? (
                <a href={item.href} target="_blank" rel="noreferrer">
                  {item.value}
                </a>
              ) : (
                <span>{item.value}</span>
              )}
            </li>
          ))}
          {cv.identity.links?.map((link) => (
            <li key={link.id}>
              <a href={link.href} target="_blank" rel="noreferrer">
                {link.label || link.href}
              </a>
            </li>
          ))}
        </ul>
      </header>

      <div className="cv-band-body">
        <OrderedSections cv={cv} />
      </div>
    </article>
  )
}
