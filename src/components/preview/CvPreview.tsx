import type { CvDocument } from '@/types/cv'
import { isSectionEnabled } from '@/types/cv'
import { CvIcon } from '@/components/icons'
import { LinkedText } from '@/components/preview/LinkedText'
import {
  CenterSectionHeader,
  SidebarSectionHeader,
} from '@/components/preview/SectionHeader'

function formatRange(start?: string, end?: string) {
  if (!start && !end) return ''
  if (start && end) return `${start} — ${end}`
  return start || end || ''
}

export function CvPreview({ cv }: { cv: CvDocument }) {
  const showAbout = isSectionEnabled(cv, 'about')
  const showSkills = isSectionEnabled(cv, 'skills')
  const showEducation = isSectionEnabled(cv, 'education')
  const showProjects = isSectionEnabled(cv, 'projects')
  const showExperience = isSectionEnabled(cv, 'experience')
  const showLanguages = isSectionEnabled(cv, 'languages')

  return (
    <div className="cv-preview-stack">
      <article className="cv-page cv-page--cover">
        <aside className="cv-sidebar">
          <div className="cv-identity">
            <h1 className="cv-name">{cv.identity.name}</h1>
            <p className="cv-role">{cv.identity.role}</p>
          </div>

          <ul className="cv-contact">
            {cv.identity.contact.map((item) => (
              <li key={item.id} className="cv-contact__item">
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

          {showAbout && (
            <section className="cv-block">
              <SidebarSectionHeader icon="about" label="About" />
              <p className="cv-about">{cv.identity.about}</p>
            </section>
          )}

          {showSkills &&
            cv.skills.map((group) => (
              <section key={group.id} className="cv-block">
                <SidebarSectionHeader icon="skills" label={group.title} />
                <ul className="cv-skill-list">
                  {group.items.map((skill) => (
                    <li key={skill.id}>
                      {skill.href ? (
                        <a href={skill.href} target="_blank" rel="noreferrer">
                          {skill.label}
                        </a>
                      ) : (
                        skill.label
                      )}
                    </li>
                  ))}
                </ul>
              </section>
            ))}
        </aside>

        <main className="cv-main">
          {showEducation && cv.education.length > 0 && (
            <section className="cv-block">
              <SidebarSectionHeader icon="education" label="Education" />
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
                    {item.summary ? <p className="cv-entry__summary">{item.summary}</p> : null}
                    {item.skillsDeveloped?.length ? (
                      <p className="cv-skills-developed">
                        <span className="cv-skills-developed__label">Skills developed:</span>{' '}
                        {item.skillsDeveloped.join(', ')}
                      </p>
                    ) : null}
                  </article>
                ))}
              </div>
            </section>
          )}

          {showProjects && cv.projects.length > 0 && (
            <section className="cv-block">
              <SidebarSectionHeader icon="projects" label="Projects" />
              <div className="cv-entry-list">
                {cv.projects.map((item) => (
                  <article key={item.id} className="cv-entry">
                    <div className="cv-entry__top">
                      <div>
                        <LinkedText href={item.href} className="cv-entry__title">
                          {item.title}
                        </LinkedText>
                      </div>
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
          )}
        </main>
      </article>

      {(showExperience || showLanguages) && (
        <article className="cv-page cv-page--flow">
          {showExperience && cv.experience.length > 0 && (
            <section className="cv-block">
              <CenterSectionHeader label="Professional Experience" />
              <div className="cv-entry-list">
                {cv.experience.map((item) => (
                  <article key={item.id} className="cv-entry cv-entry--experience">
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
                        <span className="cv-skills-developed__label">Skills developed:</span>{' '}
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
          )}

          {showLanguages && cv.languages.length > 0 && (
            <section className="cv-block cv-languages-block">
              <CenterSectionHeader label="Languages" />
              <ul className="cv-languages">
                {cv.languages.map((lang) => (
                  <li key={lang.id}>
                    <span className="cv-languages__name">{lang.name}</span>
                    <span className="cv-languages__level">{lang.level}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </article>
      )}
    </div>
  )
}
