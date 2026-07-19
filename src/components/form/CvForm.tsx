import type { ReactNode } from 'react'
import type {
  ContactItem,
  CvDocument,
  EducationItem,
  ExperienceItem,
  LanguageItem,
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

export function CvForm({ cv, onChange }: Props) {
  const order = cv.sectionOrder ?? DEFAULT_SECTION_ORDER

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
      contact: [...cv.identity.contact, createBlankContact(createId('contact'))],
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
      <section className="form-section">
        <h2>Identity</h2>
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
      </section>

      <section className="form-section">
        <h2>Contact</h2>
        {cv.identity.contact.map((item) => {
          const linkRow = isLinkContact(item.type)
          const placeholders = CONTACT_TYPE_DEFAULTS[item.type]
          return (
            <div key={item.id} className="form-card">
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
              <button
                type="button"
                className="btn btn--danger"
                onClick={() => removeContact(item.id)}
              >
                Remove contact
              </button>
            </div>
          )
        })}
        <ListActions onAdd={addContact} addLabel="Add contact" />
      </section>

      <section className="form-section">
        <h2>Sections</h2>
        <p className="form-help">Toggle visibility and reorder section ids for future layout use.</p>
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
      </section>

      <section className="form-section">
        <h2>Skills</h2>
        {cv.skills.map((group) => (
          <div key={group.id} className="form-card">
            <Field label="Group title">
              <input
                value={group.title}
                onChange={(e) => updateSkillGroup(group.id, { title: e.target.value })}
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
                      .map((label, index) => ({
                        id: group.items[index]?.id ?? createId('skill'),
                        label,
                        href: group.items[index]?.href,
                      })),
                  })
                }
              />
            </Field>
            <button
              type="button"
              className="btn btn--danger"
              onClick={() =>
                patch({ skills: cv.skills.filter((g) => g.id !== group.id) })
              }
            >
              Remove group
            </button>
          </div>
        ))}
        <ListActions
          onAdd={() =>
            patch({
              skills: [
                ...cv.skills,
                { id: createId('skillgroup'), title: 'New group', items: [] },
              ],
            })
          }
          addLabel="Add skill group"
        />
      </section>

      <ArraySection
        title="Education"
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
                <input value={item.org} onChange={(e) => update({ org: e.target.value })} />
              </Field>
              <Field label="Org href">
                <input
                  value={item.orgHref ?? ''}
                  onChange={(e) => update({ orgHref: e.target.value || undefined })}
                />
              </Field>
              <Field label="Start">
                <input
                  value={item.start}
                  onChange={(e) => update({ start: e.target.value })}
                />
              </Field>
              <Field label="End">
                <input value={item.end} onChange={(e) => update({ end: e.target.value })} />
              </Field>
              <Field label="Location">
                <input
                  value={item.location ?? ''}
                  onChange={(e) => update({ location: e.target.value || undefined })}
                />
              </Field>
            </div>
            <Field label="Summary">
              <textarea
                rows={3}
                value={item.summary ?? ''}
                onChange={(e) => update({ summary: e.target.value || undefined })}
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
        title="Projects"
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
                  onChange={(e) => update({ href: e.target.value || undefined })}
                />
              </Field>
              <Field label="Start">
                <input
                  value={item.start ?? ''}
                  onChange={(e) => update({ start: e.target.value || undefined })}
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
        title="Experience"
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
                <input value={item.org} onChange={(e) => update({ org: e.target.value })} />
              </Field>
              <Field label="Org href">
                <input
                  value={item.orgHref ?? ''}
                  onChange={(e) => update({ orgHref: e.target.value || undefined })}
                />
              </Field>
              <Field label="Start">
                <input
                  value={item.start}
                  onChange={(e) => update({ start: e.target.value })}
                />
              </Field>
              <Field label="End">
                <input value={item.end} onChange={(e) => update({ end: e.target.value })} />
              </Field>
              <Field label="Location">
                <input
                  value={item.location ?? ''}
                  onChange={(e) => update({ location: e.target.value || undefined })}
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
        title="Languages"
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
              <input value={item.name} onChange={(e) => update({ name: e.target.value })} />
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
  title,
  items,
  onChange,
  blank,
  render,
}: {
  title: string
  items: T[]
  onChange: (items: T[]) => void
  blank: () => T
  render: (item: T, update: (partial: Partial<T>) => void) => ReactNode
}) {
  return (
    <section className="form-section">
      <h2>{title}</h2>
      {items.map((item) => (
        <div key={item.id} className="form-card">
          {render(item, (partial) =>
            onChange(items.map((row) => (row.id === item.id ? { ...row, ...partial } : row))),
          )}
          <button
            type="button"
            className="btn btn--danger"
            onClick={() => onChange(items.filter((row) => row.id !== item.id))}
          >
            Remove
          </button>
        </div>
      ))}
      <ListActions onAdd={() => onChange([...items, blank()])} addLabel={`Add ${title.toLowerCase()} item`} />
    </section>
  )
}
