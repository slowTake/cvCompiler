import type { CvDocument, SectionId } from '@/types/cv'
import { DEFAULT_SECTION_ORDER, isSectionEnabled } from '@/types/cv'
import { LinkedText } from '@/components/preview/LinkedText'
import { formatRange } from '@/components/preview/format'
import { SidebarSectionHeader } from '@/components/preview/SectionHeader'

/** ATS-friendly labels for stacked single-column layouts. */
const SECTION_LABEL: Record<SectionId, string> = {
  about: 'Summary',
  skills: 'Skills',
  education: 'Education',
  projects: 'Projects',
  experience: 'Experience',
  languages: 'Languages',
}

/**
 * Renders the enabled sections in `sectionOrder` as a stacked single column.
 * Shared by the single-column and header-band skeletons; the sidebar skeleton
 * places sections by hand instead.
 */
export function OrderedSections({ cv }: { cv: CvDocument }) {
  const order = cv.sectionOrder ?? DEFAULT_SECTION_ORDER
  return (
    <>
      {order
        .filter((id) => isSectionEnabled(cv, id))
        .map((id) => (
          <Section key={id} id={id} cv={cv} />
        ))}
    </>
  )
}

function Section({ id, cv }: { id: SectionId; cv: CvDocument }) {
  switch (id) {
    case 'about':
      return cv.identity.about ? (
        <section className="cv-block">
          <SidebarSectionHeader icon="about" label={SECTION_LABEL.about} />
          <p className="cv-about">{cv.identity.about}</p>
        </section>
      ) : null

    case 'skills':
      return cv.skills.length ? (
        <section className="cv-block">
          <SidebarSectionHeader icon="skills" label={SECTION_LABEL.skills} />
          {cv.skills.map((group) => (
            <div key={group.id} className="cv-single-skillgroup">
              <h3 className="cv-single-skillgroup__title">{group.title}</h3>
              <p className="cv-single-skillgroup__items">
                {group.items.map((s) => s.label).join(' · ')}
              </p>
            </div>
          ))}
        </section>
      ) : null

    case 'education':
      return cv.education.length ? (
        <section className="cv-block">
          <SidebarSectionHeader icon="education" label={SECTION_LABEL.education} />
          <div className="cv-entry-list">
            {cv.education.map((item) => (
              <article key={item.id} className="cv-entry">
                <div className="cv-entry__top">
                  <div>
                    <h3 className="cv-entry__title">{item.title}</h3>
                    <LinkedText href={item.orgHref} className="cv-entry__org">
                      {item.org}
                    </LinkedText>
                  </div>
                  <div className="cv-entry__meta">
                    <span>{formatRange(item.start, item.end)}</span>
                    {item.location ? <span>{item.location}</span> : null}
                  </div>
                </div>
                {item.summary ? (
                  <p className="cv-entry__summary">{item.summary}</p>
                ) : null}
              </article>
            ))}
          </div>
        </section>
      ) : null

    case 'projects':
      return cv.projects.length ? (
        <section className="cv-block">
          <SidebarSectionHeader icon="projects" label={SECTION_LABEL.projects} />
          <div className="cv-entry-list">
            {cv.projects.map((item) => (
              <article key={item.id} className="cv-entry">
                <div className="cv-entry__top">
                  <h3 className="cv-entry__title">
                    <LinkedText href={item.href}>{item.title}</LinkedText>
                  </h3>
                  <div className="cv-entry__meta">
                    <span>{formatRange(item.start, item.end)}</span>
                  </div>
                </div>
                <p className="cv-entry__summary">{item.summary}</p>
                {item.stack?.length ? (
                  <p className="cv-stack">{item.stack.join(' · ')}</p>
                ) : null}
              </article>
            ))}
          </div>
        </section>
      ) : null

    case 'experience':
      return cv.experience.length ? (
        <section className="cv-block">
          <SidebarSectionHeader icon="experience" label={SECTION_LABEL.experience} />
          <div className="cv-entry-list">
            {cv.experience.map((item) => (
              <article key={item.id} className="cv-entry">
                <div className="cv-entry__top">
                  <div>
                    <h3 className="cv-entry__title">{item.title}</h3>
                    <LinkedText href={item.orgHref} className="cv-entry__org">
                      {item.org}
                    </LinkedText>
                  </div>
                  <div className="cv-entry__meta">
                    <span>{formatRange(item.start, item.end)}</span>
                    {item.location ? <span>{item.location}</span> : null}
                  </div>
                </div>
                {item.skillsDeveloped?.length ? (
                  <p className="cv-skills-developed">
                    <span className="cv-skills-developed__label">
                      Skills developed:
                    </span>{' '}
                    {item.skillsDeveloped.join(', ')}
                  </p>
                ) : null}
                <ul className="cv-bullets">
                  {item.bullets.map((bullet, index) => (
                    <li key={`${item.id}-b-${index}`}>{bullet}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>
      ) : null

    case 'languages':
      return cv.languages.length ? (
        <section className="cv-block">
          <SidebarSectionHeader icon="languages" label={SECTION_LABEL.languages} />
          <ul className="cv-languages">
            {cv.languages.map((lang) => (
              <li key={lang.id}>
                <span className="cv-languages__name">{lang.name}</span>
                <span className="cv-languages__level">{lang.level}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null

    default:
      return null
  }
}
