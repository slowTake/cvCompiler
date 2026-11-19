import { AlertTriangle, ArrowLeftRight, Lock, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { sectionTitle } from '../model/defaults';
import type { ContactKind, CvDocument, SectionId } from '../model/types';
import { CONTACT_KINDS } from '../model/types';
import type { ImportFlag, ParsedCv, UnplacedText } from '../pdf/parse';
import { renderPdfPages } from '../pdf/readPdf';
import {
  ENTRY_SECTIONS,
  entryLabel,
  moveEntry,
  placeText,
  removeEntry,
  swapTitle,
  type EntrySection,
  type PlaceTarget,
} from '../pdf/reviewOps';
import { TEMPLATES } from '../templates/registry';
import { SKELETONS } from '../templates/skeletons';
import { Modal } from '../ui/Modal';
import { FieldRow, ListTextField, TagListField, TextArea, TextField } from './fields';

interface Props {
  fileName: string;
  bytes: ArrayBuffer;
  parsed: ParsedCv;
  /** The PDF had cvCompiler data that couldn't be read. */
  damagedEmbed: boolean;
  onLoad: (doc: CvDocument) => void;
  onCancel: () => void;
}

const SWAP_LABELS: Record<EntrySection, string> = {
  experience: 'Swap title and company',
  projects: 'Swap name and role',
  education: 'Swap degree and school',
};

/**
 * Review step for a PDF read from its text: the PDF beside what was found,
 * with uncertain fields marked, quick fixes, and every piece of text that
 * couldn't be placed. Nothing reaches the editor until "Load into editor".
 */
export function PdfReview({ fileName, bytes, parsed, damagedEmbed, onLoad, onCancel }: Props) {
  const [doc, setDoc] = useState(parsed.doc);
  const [unplaced, setUnplaced] = useState<UnplacedText[]>(parsed.unplaced);
  const [pages, setPages] = useState<string[] | null>(null);
  const [pagesFailed, setPagesFailed] = useState(false);

  useEffect(() => {
    let live = true;
    renderPdfPages(bytes).then(
      (imgs) => live && setPages(imgs),
      () => live && setPagesFailed(true),
    );
    return () => {
      live = false;
    };
  }, [bytes]);

  // Flags stay attached to what they're about; entries that are removed take theirs along.
  const flags = useMemo(() => {
    const ids = new Set<string>([
      ...doc.identity.contact.map((c) => c.id),
      ...ENTRY_SECTIONS.flatMap((s) => (doc[s] as { id: string }[]).map((e) => e.id)),
      ...doc.skills.map((g) => g.id),
    ]);
    return parsed.flags.filter((f) => !f.id || ids.has(f.id));
  }, [parsed.flags, doc]);
  const flagFor = (id: string | undefined, field?: string) =>
    flags.filter((f) => f.id === id && (field === undefined || f.field === field));
  const general = flags.filter((f) => !f.id && !f.field);
  const toCheck = flags.length + unplaced.length;

  const update = (fn: (d: CvDocument) => CvDocument) => setDoc((d) => fn(d));
  const visible = doc.meta.sections.filter((s) => s.visible);

  const placeTargets = useMemo(() => {
    const targets: { value: string; label: string; target: PlaceTarget }[] = [
      { value: 'about', label: 'About (new paragraph)', target: { kind: 'about' } },
    ];
    for (const section of ENTRY_SECTIONS) {
      for (const e of doc[section] as { id: string }[]) {
        targets.push({
          value: `${section}:${e.id}`,
          label: `${sectionTitle(doc.meta.sections.find((s) => s.id === section)!)}: ${entryLabel(doc, section, e.id)}`,
          target: { kind: 'entry', section, id: e.id },
        });
      }
    }
    return targets;
  }, [doc]);

  const place = (item: UnplacedText, value: string) => {
    const t = placeTargets.find((p) => p.value === value);
    if (!t) return;
    update((d) => placeText(d, item.text, t.target));
    setUnplaced((list) => list.filter((u) => u.id !== item.id));
  };

  return (
    <Modal title={`Check the import: ${fileName}`} onClose={onCancel} wide>
      <p className="ui-hint ui-review-intro">
        <Lock size={13} aria-hidden="true" /> Read from the PDF's text on this computer; the file never leaves it. Fix
        anything that looks off, then load it. Everything stays editable afterwards.
      </p>
      {damagedEmbed && (
        <p className="ui-review-note">
          This PDF carried cvCompiler data that couldn't be read, so its visible text was used instead.
        </p>
      )}

      <div className="ui-review">
        <div className="ui-review-pdf" aria-label="The PDF">
          {pages?.map((src, i) => <img key={i} src={src} alt={`Page ${i + 1} of the PDF`} />)}
          {!pages && !pagesFailed && <p className="ui-hint">Drawing the pages…</p>}
          {pagesFailed && <p className="ui-hint">The pages couldn't be drawn, but the text was read.</p>}
        </div>

        <div className="ui-review-form">
          {general.map((f, i) => (
            <Warn key={i}>{f.message}</Warn>
          ))}

          {unplaced.length > 0 && (
            <section className="ui-review-group ui-review-unplaced">
              <h3>Couldn't place this ({unplaced.length})</h3>
              <p className="ui-hint">Text from the PDF that didn't fit anywhere. Add it somewhere, or dismiss it.</p>
              <ul>
                {unplaced.map((u) => (
                  <li key={u.id}>
                    <div className="ui-review-unplaced-text">
                      {u.heading && <span className="ui-muted">Under “{u.heading}”: </span>}
                      {u.text}
                    </div>
                    <div className="ui-review-actions">
                      <select aria-label="Add to" value="" onChange={(e) => place(u, e.target.value)}>
                        <option value="" disabled>
                          Add to…
                        </option>
                        {placeTargets.map((t) => (
                          <option key={t.value} value={t.value}>
                            {t.label}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        className="ui-btn ui-btn-ghost"
                        onClick={() => setUnplaced((list) => list.filter((x) => x.id !== u.id))}
                      >
                        Dismiss
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="ui-review-group">
            <h3>Design</h3>
            <div className="ui-field">
              <label htmlFor="review-template">Template</label>
              <select
                id="review-template"
                value={doc.meta.templateId}
                onChange={(e) => update((d) => ({ ...d, meta: { ...d.meta, templateId: e.target.value } }))}
              >
                {TEMPLATES.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({SKELETONS[t.skeleton].name})
                  </option>
                ))}
              </select>
              <p className="ui-hint">{parsed.templateReason} It's a suggestion; colours and fonts are approximate.</p>
            </div>
          </section>

          <section className="ui-review-group">
            <h3>You</h3>
            <FieldRow>
              <Flagged flags={flagFor(undefined, 'name').filter((f) => f.section === 'identity')}>
                <TextField
                  label="Name"
                  value={doc.identity.name}
                  onChange={(name) => update((d) => ({ ...d, identity: { ...d.identity, name } }))}
                />
              </Flagged>
              <TextField
                label="Role"
                value={doc.identity.role}
                onChange={(role) => update((d) => ({ ...d, identity: { ...d.identity, role } }))}
              />
            </FieldRow>
            {doc.identity.contact.map((c) => (
              <Flagged key={c.id} flags={flagFor(c.id)}>
                <div className="ui-review-contact">
                  <select
                    aria-label="Contact kind"
                    value={c.kind}
                    onChange={(e) =>
                      update((d) => ({
                        ...d,
                        identity: {
                          ...d.identity,
                          contact: d.identity.contact.map((x) => (x.id === c.id ? { ...x, kind: e.target.value as ContactKind } : x)),
                        },
                      }))
                    }
                  >
                    {CONTACT_KINDS.map((k) => (
                      <option key={k} value={k}>
                        {k}
                      </option>
                    ))}
                  </select>
                  <input
                    aria-label="Contact"
                    value={c.value}
                    onChange={(e) =>
                      update((d) => ({
                        ...d,
                        identity: {
                          ...d.identity,
                          contact: d.identity.contact.map((x) => (x.id === c.id ? { ...x, value: e.target.value } : x)),
                        },
                      }))
                    }
                  />
                  <button
                    type="button"
                    className="ui-icon-btn"
                    aria-label={`Remove ${c.value}`}
                    onClick={() =>
                      update((d) => ({ ...d, identity: { ...d.identity, contact: d.identity.contact.filter((x) => x.id !== c.id) } }))
                    }
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </Flagged>
            ))}
            {(doc.identity.links ?? []).map((l) => (
              <p key={l.id} className="ui-hint">
                Link: {l.label} → {l.url}
              </p>
            ))}
          </section>

          {visible.map((s) => (
            <section key={s.id} className="ui-review-group">
              <h3>{sectionTitle(s)}</h3>
              <ReviewSection id={s.id} doc={doc} update={update} flagFor={flagFor} />
            </section>
          ))}
        </div>
      </div>

      <div className="ui-modal-actions ui-review-footer">
        <span className="ui-muted">
          {toCheck === 0 ? 'Nothing flagged.' : `${toCheck} ${toCheck === 1 ? 'thing' : 'things'} to check.`}
        </span>
        <button type="button" className="ui-btn ui-btn-ghost" onClick={onCancel}>
          Cancel
        </button>
        <button type="button" className="ui-btn ui-btn-primary" onClick={() => onLoad(doc)}>
          Load into editor
        </button>
      </div>
    </Modal>
  );
}

function Warn({ children }: { children: ReactNode }) {
  return (
    <p className="ui-review-warn">
      <AlertTriangle size={13} aria-hidden="true" /> {children}
    </p>
  );
}

/** Marks its contents as needing a look when there are flags. */
function Flagged({ flags, children }: { flags: ImportFlag[]; children: ReactNode }) {
  if (flags.length === 0) return <>{children}</>;
  return (
    <div className="ui-review-flagged">
      {children}
      {flags.map((f, i) => (
        <Warn key={i}>{f.message}</Warn>
      ))}
    </div>
  );
}

interface SectionProps {
  id: SectionId;
  doc: CvDocument;
  update: (fn: (d: CvDocument) => CvDocument) => void;
  flagFor: (id: string | undefined, field?: string) => ImportFlag[];
}

function ReviewSection({ id, doc, update, flagFor }: SectionProps) {
  if (id === 'about') {
    return (
      <TextArea
        label="About"
        value={doc.identity.about}
        rows={5}
        onChange={(about) => update((d) => ({ ...d, identity: { ...d.identity, about } }))}
      />
    );
  }
  if (id === 'skills') {
    return (
      <>
        {doc.skills.map((g) => (
          <Flagged key={g.id} flags={flagFor(g.id)}>
            <div className="ui-review-entry">
              <TextField
                label="Group"
                value={g.name}
                onChange={(name) => update((d) => ({ ...d, skills: d.skills.map((x) => (x.id === g.id ? { ...x, name } : x)) }))}
              />
              <TagListField
                label="Skills"
                value={g.items}
                onChange={(items) => update((d) => ({ ...d, skills: d.skills.map((x) => (x.id === g.id ? { ...x, items } : x)) }))}
              />
              <EntryActions onRemove={() => update((d) => removeEntry(d, 'skills', g.id))} />
            </div>
          </Flagged>
        ))}
      </>
    );
  }
  if (id === 'languages') {
    return (
      <>
        {doc.languages.map((l) => (
          <div key={l.id} className="ui-review-entry ui-review-entry-row">
            <FieldRow>
              <TextField
                label="Language"
                value={l.name}
                onChange={(name) => update((d) => ({ ...d, languages: d.languages.map((x) => (x.id === l.id ? { ...x, name } : x)) }))}
              />
              <TextField
                label="Level"
                value={l.level}
                onChange={(level) => update((d) => ({ ...d, languages: d.languages.map((x) => (x.id === l.id ? { ...x, level } : x)) }))}
              />
            </FieldRow>
            <EntryActions onRemove={() => update((d) => removeEntry(d, 'languages', l.id))} />
          </div>
        ))}
      </>
    );
  }
  return <EntryReview section={id} doc={doc} update={update} flagFor={flagFor} />;
}

function EntryReview({ section, doc, update, flagFor }: Omit<SectionProps, 'id'> & { section: EntrySection }) {
  const set = (entryId: string, patch: Record<string, unknown>) =>
    update((d) => ({ ...d, [section]: (d[section] as { id: string }[]).map((x) => (x.id === entryId ? { ...x, ...patch } : x)) }));
  const others = ENTRY_SECTIONS.filter((s) => s !== section);
  const sectionName = (s: EntrySection) => sectionTitle(doc.meta.sections.find((x) => x.id === s)!);

  return (
    <>
      {(doc[section] as { id: string }[]).map((raw) => {
        const entryFlags = flagFor(raw.id);
        const fieldFlags = (field: string) => entryFlags.filter((f) => f.field === field);
        const loose = entryFlags.filter((f) => !f.field);
        const dates = (start: string | undefined, end: string | undefined) => (
          <Flagged flags={fieldFlags('start')}>
            <FieldRow>
              <TextField label="Start" value={start} onChange={(v) => set(raw.id, { start: v })} />
              <TextField label="End" value={end} onChange={(v) => set(raw.id, { end: v })} />
            </FieldRow>
          </Flagged>
        );
        let fields: ReactNode;
        if (section === 'experience') {
          const e = doc.experience.find((x) => x.id === raw.id)!;
          fields = (
            <>
              <FieldRow>
                <Flagged flags={fieldFlags('title')}>
                  <TextField label="Job title" value={e.title} onChange={(v) => set(e.id, { title: v })} />
                </Flagged>
                <Flagged flags={fieldFlags('org')}>
                  <TextField label="Company" value={e.org} onChange={(v) => set(e.id, { org: v })} />
                </Flagged>
              </FieldRow>
              {dates(e.start, e.end)}
              <TextField label="Location" value={e.location} onChange={(v) => set(e.id, { location: v })} />
              <TextArea label="Description" value={e.description} rows={4} onChange={(v) => set(e.id, { description: v })} />
              <TagListField label="Skills developed" value={e.skills} onChange={(v) => set(e.id, { skills: v })} />
            </>
          );
        } else if (section === 'projects') {
          const p = doc.projects.find((x) => x.id === raw.id)!;
          fields = (
            <>
              <FieldRow>
                <TextField label="Name" value={p.name} onChange={(v) => set(p.id, { name: v })} />
                <Flagged flags={fieldFlags('org')}>
                  <TextField label="Role" value={p.role} onChange={(v) => set(p.id, { role: v })} />
                </Flagged>
              </FieldRow>
              {dates(p.start, p.end)}
              <TextField label="Link" type="url" value={p.url} onChange={(v) => set(p.id, { url: v })} />
              <TextArea label="Description" value={p.description} rows={4} onChange={(v) => set(p.id, { description: v })} />
              <TagListField label="Tech" value={p.tech} onChange={(v) => set(p.id, { tech: v })} />
            </>
          );
        } else {
          const e = doc.education.find((x) => x.id === raw.id)!;
          fields = (
            <>
              <FieldRow>
                <TextField label="Degree" value={e.degree} onChange={(v) => set(e.id, { degree: v })} />
                <Flagged flags={fieldFlags('org')}>
                  <TextField label="School" value={e.institution} onChange={(v) => set(e.id, { institution: v })} />
                </Flagged>
              </FieldRow>
              {dates(e.start, e.end)}
              <TextField label="Location" value={e.location} onChange={(v) => set(e.id, { location: v })} />
              <ListTextField label="Details" value={e.details} onChange={(v) => set(e.id, { details: v })} />
            </>
          );
        }
        return (
          <div key={raw.id} className={`ui-review-entry${entryFlags.length ? ' is-flagged' : ''}`}>
            {loose.map((f, i) => (
              <Warn key={i}>{f.message}</Warn>
            ))}
            {fields}
            <EntryActions
              onSwap={() => update((d) => swapTitle(d, section, raw.id))}
              swapLabel={SWAP_LABELS[section]}
              moveTo={others.map((s) => ({ value: s, label: sectionName(s) }))}
              onMove={(to) => update((d) => moveEntry(d, section, raw.id, to))}
              onRemove={() => update((d) => removeEntry(d, section, raw.id))}
            />
          </div>
        );
      })}
    </>
  );
}

function EntryActions({
  onSwap,
  swapLabel,
  moveTo,
  onMove,
  onRemove,
}: {
  onSwap?: () => void;
  swapLabel?: string;
  moveTo?: { value: EntrySection; label: string }[];
  onMove?: (to: EntrySection) => void;
  onRemove: () => void;
}) {
  return (
    <div className="ui-review-actions">
      {onSwap && (
        <button type="button" className="ui-btn ui-btn-ghost" onClick={onSwap}>
          <ArrowLeftRight size={14} /> {swapLabel}
        </button>
      )}
      {moveTo && onMove && (
        <select aria-label="Move to" value="" onChange={(e) => onMove(e.target.value as EntrySection)}>
          <option value="" disabled>
            Move to…
          </option>
          {moveTo.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>
      )}
      <button type="button" className="ui-btn ui-btn-ghost" onClick={onRemove}>
        <Trash2 size={14} /> Remove
      </button>
    </div>
  );
}
