import { X } from 'lucide-react';
import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { applyTagDraft, removeAt } from '../model/list';

interface FieldShellProps {
  label: string;
  hint?: ReactNode;
  id: string;
  children: ReactNode;
  wide?: boolean;
}

function FieldShell({ label, hint, id, children, wide }: FieldShellProps) {
  return (
    <div className={`ui-field${wide ? ' ui-field-wide' : ''}`}>
      <label htmlFor={id}>{label}</label>
      {children}
      {hint && <p className="ui-hint">{hint}</p>}
    </div>
  );
}

interface TextFieldProps {
  label: string;
  value: string | undefined;
  onChange: (value: string) => void;
  placeholder?: string;
  hint?: ReactNode;
  wide?: boolean;
  type?: 'text' | 'email' | 'url' | 'tel';
}

export function TextField({ label, value, onChange, placeholder, hint, wide, type = 'text' }: TextFieldProps) {
  const id = useId();
  return (
    <FieldShell label={label} hint={hint} id={id} wide={wide}>
      <input
        id={id}
        type={type}
        value={value ?? ''}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </FieldShell>
  );
}

interface TextAreaProps {
  label: string;
  value: string | undefined;
  onChange: (value: string) => void;
  rows?: number;
  placeholder?: string;
  hint?: ReactNode;
}

export function TextArea({ label, value, onChange, rows = 4, placeholder, hint }: TextAreaProps) {
  const id = useId();
  return (
    <FieldShell label={label} hint={hint} id={id} wide>
      <textarea
        id={id}
        rows={rows}
        value={value ?? ''}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </FieldShell>
  );
}

function splitLines(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);
}

const sameList = (a: readonly string[], b: readonly string[]) =>
  a.length === b.length && a.every((v, i) => v === b[i]);

const NO_ITEMS: readonly string[] = [];

interface ListTextFieldProps {
  label: string;
  value: readonly string[] | undefined;
  onChange: (value: string[]) => void;
  rows?: number;
  placeholder?: string;
  hint?: ReactNode;
}

/**
 * Edits a list of strings as text, one per line. Keeps a local draft so blank
 * lines survive while typing, and only resyncs when the list changes from
 * outside.
 */
export function ListTextField({ label, value, onChange, rows, placeholder, hint }: ListTextFieldProps) {
  const id = useId();
  const items = value ?? NO_ITEMS;
  const [draft, setDraft] = useState(() => items.join('\n'));

  useEffect(() => {
    setDraft((current) => (sameList(splitLines(current), items) ? current : items.join('\n')));
  }, [items]);

  const handle = (text: string) => {
    setDraft(text);
    const next = splitLines(text);
    if (!sameList(next, items)) onChange(next);
  };

  return (
    <FieldShell label={label} id={id} wide hint={hint ?? 'One item per line.'}>
      <textarea
        id={id}
        rows={rows ?? Math.min(8, Math.max(3, items.length + 1))}
        value={draft}
        placeholder={placeholder}
        onChange={(e) => handle(e.target.value)}
      />
    </FieldShell>
  );
}

interface TagListFieldProps {
  label: string;
  value: readonly string[] | undefined;
  onChange: (value: string[]) => void;
  placeholder?: string;
}

/**
 * Edits a list of short tags as chips. Enter or a comma adds what you typed;
 * clicking a chip (or Backspace in an empty input) edits it in place. Stored
 * tags are never re-split, so a tag such as "Node.js, Deno" stays one tag.
 */
export function TagListField({ label, value, onChange, placeholder }: TagListFieldProps) {
  const id = useId();
  const tags = value ?? NO_ITEMS;
  const [draft, setDraft] = useState('');
  const [editing, setEditing] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing !== null && editing >= tags.length) setEditing(null);
  }, [editing, tags.length]);

  /** Commits the draft; returns the new list and where index `i` moved to. */
  const settle = (i?: number) => {
    const next = applyTagDraft(tags, draft, editing);
    const removedEdited = editing !== null && next.length < tags.length;
    const moved = i === undefined ? undefined : removedEdited && editing! < i ? i - 1 : i;
    if (!sameList(next, tags)) onChange(next);
    return { next, moved };
  };

  const commit = () => {
    settle();
    setDraft('');
    setEditing(null);
  };

  const startEdit = (i: number) => {
    if (editing === i) return;
    const { next, moved } = settle(i);
    if (moved === undefined || moved < 0 || moved >= next.length) return;
    setEditing(moved);
    setDraft(next[moved]);
    inputRef.current?.focus();
  };

  const remove = (i: number) => {
    if (editing === i) {
      onChange(removeAt(tags, i));
    } else {
      const { next, moved } = settle(i);
      if (moved !== undefined) onChange(removeAt(next, moved));
    }
    setDraft('');
    setEditing(null);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || (e.key === ',' && editing === null)) {
      e.preventDefault();
      commit();
    } else if (e.key === 'Escape') {
      setDraft('');
      setEditing(null);
    } else if (e.key === 'Backspace' && draft === '' && editing === null && tags.length > 0) {
      e.preventDefault();
      startEdit(tags.length - 1);
    }
  };

  return (
    <FieldShell
      label={label}
      id={id}
      wide
      hint={editing === null ? 'Enter or comma adds a tag. Click a tag to edit it.' : 'Enter saves, Esc cancels.'}
    >
      <div className="ui-tags" onClick={() => inputRef.current?.focus()}>
        {tags.map((tag, i) => (
          <span key={`${i}-${tag}`} className={`ui-tag-chip${editing === i ? ' is-editing' : ''}`}>
            <button
              type="button"
              className="ui-tag-text"
              title="Edit"
              onMouseDown={(e) => e.preventDefault()}
              onClick={(e) => {
                e.stopPropagation();
                startEdit(i);
              }}
            >
              {tag}
            </button>
            <button
              type="button"
              className="ui-tag-remove"
              aria-label={`Remove ${tag}`}
              onMouseDown={(e) => e.preventDefault()}
              onClick={(e) => {
                e.stopPropagation();
                remove(i);
              }}
            >
              <X size={12} />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          id={id}
          type="text"
          value={draft}
          placeholder={tags.length === 0 ? placeholder : undefined}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKeyDown}
          onBlur={commit}
        />
      </div>
    </FieldShell>
  );
}

interface SelectFieldProps<T extends string> {
  label: string;
  value: T;
  options: readonly { value: T; label: string }[];
  onChange: (value: T) => void;
  hint?: ReactNode;
}

export function SelectField<T extends string>({ label, value, options, onChange, hint }: SelectFieldProps<T>) {
  const id = useId();
  return (
    <FieldShell label={label} hint={hint} id={id}>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value as T)}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </FieldShell>
  );
}

/** Two-column grid for short fields. */
export function FieldRow({ children }: { children: ReactNode }) {
  return <div className="ui-field-row">{children}</div>;
}
