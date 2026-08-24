import { useEffect, useState, type ReactNode } from 'react'
import type {
  ContactItem,
  CvDocument,
  EducationItem,
  ExperienceItem,
  LanguageItem,
  LinkItem,
  ProjectItem,
  SectionId,
  SkillGroup,
} from '@/types/cv'
import { DEFAULT_SECTION_ORDER } from '@/types/cv'
import { CvIcon } from '@/components/icons'
import {
  CONTACT_TYPE_DEFAULTS,
  applyContactTypeChange,
  applyContactValueChange,
  createBlankContact,
  isLinkContact,
} from '@/lib/contactFields'
import {
  CONTACT_ICON_OPTIONS,
  isKnownContactIcon,
  resolveContactIcon,
} from '@/lib/contactIcons'
import { createId } from '@/lib/ids'

type Props = {
  cv: CvDocument
  onChange: (next: CvDocument) => void
}

type FormSectionId =
  | 'identity'
  | 'contact'
  | 'links'
  | 'visibility'
  | 'skills'
  | 'education'
  | 'projects'
  | 'experience'
  | 'languages'

/** Section order + display titles — single source for the sections and the jump-nav. */
const FORM_SECTION_ORDER: FormSectionId[] = [
  'identity',
  'contact',
  'links',
  'visibility',
  'skills',
  'education',
  'projects',
  'experience',
  'languages',
]

const SECTION_TITLE: Record<FormSectionId, string> = {
  identity: 'Identity',
  contact: 'Contact',
  links: 'Links',
  visibility: 'Sections',
  skills: 'Skills',
  education: 'Education',
  projects: 'Projects',
  experience: 'Experience',
  languages: 'Languages',
}

/** First load opens Identity only, so the form isn't a wall; persisted after. */
const DEFAULT_OPEN: Record<FormSectionId, boolean> = {
  identity: true,
  contact: false,
  links: false,
  visibility: false,
  skills: false,
  education: false,
  projects: false,
  experience: false,
  languages: false,
}

const OPEN_STATE_KEY = 'cvstudio:form-open'

function loadOpenState(): Record<FormSectionId, boolean> {
  try {
    const raw = localStorage.getItem(OPEN_STATE_KEY)
    if (!raw) return DEFAULT_OPEN
    const parsed = JSON.parse(raw) as Partial<Record<FormSectionId, boolean>>
    return { ...DEFAULT_OPEN, ...parsed }
  } catch {
    return DEFAULT_OPEN
  }
}

function saveOpenState(state: Record<FormSectionId, boolean>): void {
  try {
    localStorage.setItem(OPEN_STATE_KEY, JSON.stringify(state))
  } catch {
    // ignore storage failures (private mode, quota)
  }
}

function moveIndex<T>(items: T[], index: number, direction: -1 | 1): T[] {
  const nextIndex = index + direction
  if (nextIndex < 0 || nextIndex >= items.length) return items
  const next = [...items]
  ;[next[index], next[nextIndex]] = [next[nextIndex], next[index]]
  return next
}

function Field({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <label className="field">
      <span className="field__label">{label}</span>
      {children}
    </label>
  )
}

function ListActions({
  onAdd,
  addLabel,
}: {
  onAdd: () => void
  addLabel: string
}) {
  return (
    <div className="list-actions">
      <button type="button" className="btn btn--ghost" onClick={onAdd}>
        {addLabel}
      </button>
    </div>
  )
}

function FormSection({
  sectionId,
  open,
  onToggle,
  count,
  children,
}: {
  sectionId: FormSectionId
  open: boolean
  onToggle: () => void
  count?: number
  children: ReactNode
}) {
  return (
    <section
      id={`form-sec-${sectionId}`}
      className={`form-section${open ? '' : ' form-section--collapsed'}`}
    >
      <button
        type="button"
        className="form-section__toggle"
        onClick={onToggle}
        aria-expanded={open}
      >
        <span className="form-section__title">
          <span className="form-section__chevron" aria-hidden="true">
            {open ? '▾' : '▸'}
          </span>
          {SECTION_TITLE[sectionId]}
        </span>
        {typeof count === 'number' ? (
          <span className="form-section__count">{count}</span>
        ) : null}
      </button>
      {open ? <div className="form-section__body">{children}</div> : null}
    </section>
  )
}

function FormNav({
  active,
  onJump,
}: {
  active: FormSectionId
  onJump: (id: FormSectionId) => void
}) {
  return (
    <nav className="form-nav" aria-label="Jump to form section">
      {FORM_SECTION_ORDER.map((id) => (
        <button
          key={id}
          type="button"
          className={`form-nav__chip${active === id ? ' form-nav__chip--active' : ''}`}
          aria-current={active === id ? 'true' : undefined}
          onClick={() => onJump(id)}
        >
          {SECTION_TITLE[id]}
        </button>
      ))}
    </nav>
  )
}

function ItemToolbar({
  index,
  total,
  onMove,
  onRemove,
  removeLabel = 'Remove',
}: {
  index: number
  total: number
  onMove: (direction: -1 | 1) => void
  onRemove: () => void
  removeLabel?: string
}) {
  return (
    <div className="form-card__toolbar">
      <span className="form-card__index">#{index + 1}</span>
      <div className="form-card__actions">
        <button
          type="button"
          className="btn btn--ghost"
          disabled={index === 0}
          onClick={() => onMove(-1)}
          title="Move up"
        >
          Up
        </button>
        <button
          type="button"
          className="btn btn--ghost"
          disabled={index === total - 1}
          onClick={() => onMove(1)}
          title="Move down"
        >
          Down
        </button>
        <button type="button" className="btn btn--danger" onClick={onRemove}>
          {removeLabel}
        </button>
      </div>
    </div>
  )
}

export function CvForm({ cv, onChange }: Props) {
  const order = cv.sectionOrder ?? DEFAULT_SECTION_ORDER
  const [openSections, setOpenSections] =
    useState<Record<FormSectionId, boolean>>(loadOpenState)
  const [activeSection, setActiveSection] = useState<FormSectionId>('identity')

  // Persist which sections are open, so the layout survives reloads.
  useEffect(() => {
    saveOpenState(openSections)
  }, [openSections])

  // Scroll-spy: highlight the last section whose header has scrolled past the
  // sticky nav line. A scroll listener (not IntersectionObserver) so it stays
  // deterministic and works even when the tab isn't compositing.
  useEffect(() => {
    const pane = document.querySelector<HTMLElement>('.app-form-pane')
    if (!pane) return
    const update = () => {
      const paneTop = pane.getBoundingClientRect().top
      let current: FormSectionId = FORM_SECTION_ORDER[0]
      for (const id of FORM_SECTION_ORDER) {
        const el = document.getElementById(`form-sec-${id}`)
        if (!el) continue
        if (el.getBoundingClientRect().top - paneTop <= 72) current = id
        else break
      }
      setActiveSection(current)
    }
    pane.addEventListener('scroll', update, { passive: true })
    update()
    return () => pane.removeEventListener('scroll', update)
  }, [])

  function toggleSection(id: FormSectionId) {
    setOpenSections((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  function jumpToSection(id: FormSectionId) {
    setOpenSections((prev) => ({ ...prev, [id]: true }))
    setActiveSection(id)
    document
      .getElementById(`form-sec-${id}`)
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  function patch(partial: Partial<CvDocument>) {
    onChange({ ...cv, ...partial })
  }

  function patchIdentity(partial: Partial<CvDocument['identity']>) {
    patch({ identity: { ...cv.identity, ...partial } })
  }

  function updateContact(id: string, partial: Partial<ContactItem>) {
    patchIdentity({
      contact: cv.identity.contact.map((item) =>
        item.id === id ? { ...item, ...partial } : item,
      ),
    })
  }

  function replaceContact(id: string, next: ContactItem) {
    patchIdentity({
      contact: cv.identity.contact.map((item) => (item.id === id ? next : item)),
    })
  }

  function removeContact(id: string) {
    patchIdentity({
      contact: cv.identity.contact.filter((item) => item.id !== id),
    })
  }

  function addContact() {
    patchIdentity({
      contact: [createBlankContact(createId('contact')), ...cv.identity.contact],
    })
  }

  function moveContact(index: number, direction: -1 | 1) {
    patchIdentity({ contact: moveIndex(cv.identity.contact, index, direction) })
  }

  function updateLink(id: string, partial: Partial<LinkItem>) {
    patchIdentity({
      links: (cv.identity.links ?? []).map((item) =>
        item.id === id ? { ...item, ...partial } : item,
      ),
    })
  }

  function removeLink(id: string) {
    patchIdentity({
      links: (cv.identity.links ?? []).filter((item) => item.id !== id),
    })
  }

  function addLink() {
    patchIdentity({
      links: [
        ...(cv.identity.links ?? []),
        { id: createId('link'), label: '', href: '' },
      ],
    })
  }

  function moveLink(index: number, direction: -1 | 1) {
    patchIdentity({
      links: moveIndex(cv.identity.links ?? [], index, direction),
    })
  }

  function updateSkillGroup(id: string, partial: Partial<SkillGroup>) {
    patch({
      skills: cv.skills.map((group) =>
        group.id === id ? { ...group, ...partial } : group,
      ),
    })
  }

  function setSectionEnabled(id: SectionId, enabled: boolean) {
    patch({
      sectionsEnabled: {
        ...cv.sectionsEnabled,
        [id]: enabled,
      },
    })
  }

  function moveSection(id: SectionId, direction: -1 | 1) {
    const index = order.indexOf(id)
    const nextIndex = index + direction
    if (index < 0 || nextIndex < 0 || nextIndex >= order.length) return
    const next = [...order]
    ;[next[index], next[nextIndex]] = [next[nextIndex], next[index]]
    patch({ sectionOrder: next })
  }

  return (
    <div className="cv-form">
      <FormNav active={activeSection} onJump={jumpToSection} />
      <FormSection
        sectionId="identity"
        open={openSections.identity}
        onToggle={() => toggleSection('identity')}
      >
        <div className="form-grid">
          <Field label="Name">
            <input
              value={cv.identity.name}
              onChange={(e) => patchIdentity({ name: e.target.value })}
            />
          </Field>
          <Field label="Role">
            <input
              value={cv.identity.role}
              onChange={(e) => patchIdentity({ role: e.target.value })}
            />
          </Field>
          <Field label="Tagline">
            <input
              value={cv.identity.tagline ?? ''}
              placeholder="One-line summary (optional)"
              onChange={(e) =>
                patchIdentity({ tagline: e.target.value || undefined })
              }
            />
          </Field>
          <Field label="Document title">
            <input
              value={cv.meta.title}
              onChange={(e) =>
                patch({ meta: { ...cv.meta, title: e.target.value } })
              }
            />
          </Field>
        </div>
        <Field label="About">
          <textarea
            rows={4}
            value={cv.identity.about}
            onChange={(e) => patchIdentity({ about: e.target.value })}
          />
        </Field>
      </FormSection>

      <FormSection
        sectionId="contact"
        open={openSections.contact}
        onToggle={() => toggleSection('contact')}
        count={cv.identity.contact.length}
      >
        {cv.identity.contact.map((item, index) => {
          const linkRow = isLinkContact(item.type)
          const placeholders = CONTACT_TYPE_DEFAULTS[item.type]
          return (
            <div key={item.id} className="form-card">
              <ItemToolbar
                index={index}
                total={cv.identity.contact.length}
                onMove={(direction) => moveContact(index, direction)}
                onRemove={() => removeContact(item.id)}
                removeLabel="Remove contact"
              />
              <div className="form-grid">
                <Field label="Type">
                  <select
                    value={item.type}
                    onChange={(e) =>
                      replaceContact(
                        item.id,
                        applyContactTypeChange(
                          item,
                          e.target.value as ContactItem['type'],
                        ),
                      )
                    }
                  >
                    <option value="email">email</option>
                    <option value="phone">phone</option>
                    <option value="location">location</option>
                    <option value="link">link</option>
                  </select>
                </Field>
                <Field label="Value">
                  <input
                    value={item.value}
                    placeholder={placeholders.valuePlaceholder}
                    onChange={(e) =>
                      replaceContact(
                        item.id,
                        applyContactValueChange(item, e.target.value),
                      )
                    }
                  />
                </Field>
                {linkRow ? (
                  <Field label="Label">
                    <input
                      value={item.label}
                      onChange={(e) =>
                        updateContact(item.id, { label: e.target.value })
                      }
                    />
                  </Field>
                ) : null}
                {linkRow ? (
                  <Field label="URL">
                    <input
                      value={item.href ?? ''}
                      placeholder="https://…"
                      onChange={(e) =>
                        updateContact(item.id, {
                          href: e.target.value || undefined,
                        })
                      }
                    />
                  </Field>
                ) : null}
                <Field label="Icon">
                  <span className="icon-select">
                    <CvIcon
                      name={resolveContactIcon(item.icon)}
                      className="icon-select__preview"
                      size={16}
                    />
                    <select
                      value={resolveContactIcon(item.icon)}
                      onChange={(e) =>
                        updateContact(item.id, {
                          icon: e.target.value || undefined,
                        })
                      }
                    >
                      {!isKnownContactIcon(item.icon) ? (
                        <option value={resolveContactIcon(item.icon)}>
                          {resolveContactIcon(item.icon)} (custom)
                        </option>
                      ) : null}
                      {CONTACT_ICON_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </span>
                </Field>
              </div>
            </div>
          )
        })}
        <ListActions onAdd={addContact} addLabel="Add contact" />
      </FormSection>

      <FormSection
        sectionId="links"
        open={openSections.links}
        onToggle={() => toggleSection('links')}
        count={cv.identity.links?.length ?? 0}
      >
        <p className="form-help">
          Optional social / portfolio links, shown as a compact row by templates
          that support it.
        </p>
        {(cv.identity.links ?? []).map((item, index) => (
          <div key={item.id} className="form-card">
            <ItemToolbar
              index={index}
              total={cv.identity.links?.length ?? 0}
              onMove={(direction) => moveLink(index, direction)}
              onRemove={() => removeLink(item.id)}
              removeLabel="Remove link"
            />
            <div className="form-grid">
              <Field label="Label">
                <input
                  value={item.label}
                  placeholder="GitHub"
                  onChange={(e) => updateLink(item.id, { label: e.target.value })}
                />
              </Field>
              <Field label="URL">
                <input
                  value={item.href}
                  placeholder="https://…"
                  onChange={(e) => updateLink(item.id, { href: e.target.value })}
                />
              </Field>
            </div>
          </div>
        ))}
        <ListActions onAdd={addLink} addLabel="Add link" />
      </FormSection>

      <FormSection
        sectionId="visibility"
        open={openSections.visibility}
        onToggle={() => toggleSection('visibility')}
      >
        <p className="form-help">
          Toggle which CV sections appear in the preview, and reorder their ids.
        </p>
        <ul className="section-order">
          {order.map((id, index) => (
            <li key={id}>
              <label>
                <input
                  type="checkbox"
                  checked={cv.sectionsEnabled?.[id] !== false}
                  onChange={(e) => setSectionEnabled(id, e.target.checked)}
                />
                {id}
              </label>
              <span className="section-order__actions">
                <button
                  type="button"
                  className="btn btn--ghost"
                  disabled={index === 0}
                  onClick={() => moveSection(id, -1)}
                >
                  Up
                </button>
                <button
                  type="button"
                  className="btn btn--ghost"
                  disabled={index === order.length - 1}
                  onClick={() => moveSection(id, 1)}
                >
                  Down
                </button>
              </span>
            </li>
          ))}
        </ul>
      </FormSection>

      <FormSection
        sectionId="skills"
        open={openSections.skills}
        onToggle={() => toggleSection('skills')}
        count={cv.skills.length}
      >
        {cv.skills.map((group, index) => (
          <div key={group.id} className="form-card">
            <ItemToolbar
              index={index}
              total={cv.skills.length}
              onMove={(direction) =>
                patch({ skills: moveIndex(cv.skills, index, direction) })
              }
              onRemove={() =>
                patch({ skills: cv.skills.filter((g) => g.id !== group.id) })
              }
              removeLabel="Remove group"
            />
            <Field label="Group title">
              <input
                value={group.title}
                onChange={(e) =>
                  updateSkillGroup(group.id, { title: e.target.value })
                }
              />
            </Field>
            <Field label="Items (one per line)">
              <textarea
                rows={4}
                value={group.items.map((item) => item.label).join('\n')}
                onChange={(e) =>
                  updateSkillGroup(group.id, {
                    items: e.target.value
                      .split('\n')
                      .map((line) => line.trim())
                      .filter(Boolean)
                      .map((label, itemIndex) => ({
                        id: group.items[itemIndex]?.id ?? createId('skill'),
                        label,
                        href: group.items[itemIndex]?.href,
                      })),
                  })
                }
              />
            </Field>
          </div>
        ))}
        <ListActions
          onAdd={() =>
            patch({
              skills: [
                { id: createId('skillgroup'), title: 'New group', items: [] },
                ...cv.skills,
              ],
            })
          }
          addLabel="Add skill group"
        />
      </FormSection>

      <ArraySection
        sectionId="education"
        open={openSections.education}
        onToggle={() => toggleSection('education')}
        items={cv.education}
        onChange={(education) => patch({ education })}
        blank={(): EducationItem => ({
          id: createId('edu'),
          title: '',
          org: '',
          start: '',
          end: '',
          summary: '',
          skillsDeveloped: [],
        })}
        render={(item, update) => (
          <>
            <div className="form-grid">
              <Field label="Title">
                <input
                  value={item.title}
                  onChange={(e) => update({ title: e.target.value })}
                />
              </Field>
              <Field label="Org">
                <input
                  value={item.org}
                  onChange={(e) => update({ org: e.target.value })}
                />
              </Field>
              <Field label="Org href">
                <input
                  value={item.orgHref ?? ''}
                  onChange={(e) =>
                    update({ orgHref: e.target.value || undefined })
                  }
                />
              </Field>
              <Field label="Start">
                <input
                  value={item.start}
                  onChange={(e) => update({ start: e.target.value })}
                />
              </Field>
              <Field label="End">
                <input
                  value={item.end}
                  onChange={(e) => update({ end: e.target.value })}
                />
              </Field>
              <Field label="Location">
                <input
                  value={item.location ?? ''}
                  onChange={(e) =>
                    update({ location: e.target.value || undefined })
                  }
                />
              </Field>
            </div>
            <Field label="Summary">
              <textarea
                rows={3}
                value={item.summary ?? ''}
                onChange={(e) =>
                  update({ summary: e.target.value || undefined })
                }
              />
            </Field>
            <Field label="Skills developed (comma-separated)">
              <input
                value={(item.skillsDeveloped ?? []).join(', ')}
                onChange={(e) =>
                  update({
                    skillsDeveloped: e.target.value
                      .split(',')
                      .map((s) => s.trim())
                      .filter(Boolean),
                  })
                }
              />
            </Field>
          </>
        )}
      />

      <ArraySection
        sectionId="projects"
        open={openSections.projects}
        onToggle={() => toggleSection('projects')}
        items={cv.projects}
        onChange={(projects) => patch({ projects })}
        blank={(): ProjectItem => ({
          id: createId('project'),
          title: '',
          summary: '',
          stack: [],
        })}
        render={(item, update) => (
          <>
            <div className="form-grid">
              <Field label="Title">
                <input
                  value={item.title}
                  onChange={(e) => update({ title: e.target.value })}
                />
              </Field>
              <Field label="Href">
                <input
                  value={item.href ?? ''}
                  onChange={(e) =>
                    update({ href: e.target.value || undefined })
                  }
                />
              </Field>
              <Field label="Start">
                <input
                  value={item.start ?? ''}
                  onChange={(e) =>
                    update({ start: e.target.value || undefined })
                  }
                />
              </Field>
              <Field label="End">
                <input
                  value={item.end ?? ''}
                  onChange={(e) => update({ end: e.target.value || undefined })}
                />
              </Field>
            </div>
            <Field label="Summary">
              <textarea
                rows={3}
                value={item.summary}
                onChange={(e) => update({ summary: e.target.value })}
              />
            </Field>
            <Field label="Stack (comma-separated)">
              <input
                value={(item.stack ?? []).join(', ')}
                onChange={(e) =>
                  update({
                    stack: e.target.value
                      .split(',')
                      .map((s) => s.trim())
                      .filter(Boolean),
                  })
                }
              />
            </Field>
          </>
        )}
      />

      <ArraySection
        sectionId="experience"
        open={openSections.experience}
        onToggle={() => toggleSection('experience')}
        items={cv.experience}
        onChange={(experience) => patch({ experience })}
        blank={(): ExperienceItem => ({
          id: createId('exp'),
          title: '',
          org: '',
          start: '',
          end: '',
          bullets: [''],
          skillsDeveloped: [],
        })}
        render={(item, update) => (
          <>
            <div className="form-grid">
              <Field label="Title">
                <input
                  value={item.title}
                  onChange={(e) => update({ title: e.target.value })}
                />
              </Field>
              <Field label="Org">
                <input
                  value={item.org}
                  onChange={(e) => update({ org: e.target.value })}
                />
              </Field>
              <Field label="Org href">
                <input
                  value={item.orgHref ?? ''}
                  onChange={(e) =>
                    update({ orgHref: e.target.value || undefined })
                  }
                />
              </Field>
              <Field label="Start">
                <input
                  value={item.start}
                  onChange={(e) => update({ start: e.target.value })}
                />
              </Field>
              <Field label="End">
                <input
                  value={item.end}
                  onChange={(e) => update({ end: e.target.value })}
                />
              </Field>
              <Field label="Location">
                <input
                  value={item.location ?? ''}
                  onChange={(e) =>
                    update({ location: e.target.value || undefined })
                  }
                />
              </Field>
            </div>
            <Field label="Skills developed (comma-separated)">
              <input
                value={(item.skillsDeveloped ?? []).join(', ')}
                onChange={(e) =>
                  update({
                    skillsDeveloped: e.target.value
                      .split(',')
                      .map((s) => s.trim())
                      .filter(Boolean),
                  })
                }
              />
            </Field>
            <Field label="Bullets (one per line)">
              <textarea
                rows={5}
                value={item.bullets.join('\n')}
                onChange={(e) => update({ bullets: e.target.value.split('\n') })}
              />
            </Field>
          </>
        )}
      />

      <ArraySection
        sectionId="languages"
        open={openSections.languages}
        onToggle={() => toggleSection('languages')}
        items={cv.languages}
        onChange={(languages) => patch({ languages })}
        blank={(): LanguageItem => ({
          id: createId('lang'),
          name: '',
          level: '',
        })}
        render={(item, update) => (
          <div className="form-grid">
            <Field label="Name">
              <input
                value={item.name}
                onChange={(e) => update({ name: e.target.value })}
              />
            </Field>
            <Field label="Level">
              <input
                value={item.level}
                onChange={(e) => update({ level: e.target.value })}
              />
            </Field>
          </div>
        )}
      />
    </div>
  )
}

function ArraySection<T extends { id: string }>({
  sectionId,
  open,
  onToggle,
  items,
  onChange,
  blank,
  render,
}: {
  sectionId: FormSectionId
  open: boolean
  onToggle: () => void
  items: T[]
  onChange: (items: T[]) => void
  blank: () => T
  render: (item: T, update: (partial: Partial<T>) => void) => ReactNode
}) {
  return (
    <FormSection
      sectionId={sectionId}
      open={open}
      onToggle={onToggle}
      count={items.length}
    >
      {items.map((item, index) => (
        <div key={item.id} className="form-card">
          <ItemToolbar
            index={index}
            total={items.length}
            onMove={(direction) => onChange(moveIndex(items, index, direction))}
            onRemove={() => onChange(items.filter((row) => row.id !== item.id))}
          />
          {render(item, (partial) =>
            onChange(
              items.map((row) =>
                row.id === item.id ? { ...row, ...partial } : row,
              ),
            ),
          )}
        </div>
      ))}
      <ListActions
        onAdd={() => onChange([blank(), ...items])}
        addLabel={`Add ${SECTION_TITLE[sectionId].toLowerCase()} item`}
      />
    </FormSection>
  )
}
