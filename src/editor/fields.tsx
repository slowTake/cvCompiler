import { useEffect, useId, useState, type ReactNode } from 'react';

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

function splitList(text: string, mode: 'lines' | 'comma'): string[] {
  return text
    .split(mode === 'lines' ? /\r?\n/ : /,|\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);
}

const joinList = (items: readonly string[], mode: 'lines' | 'comma') =>
  items.join(mode === 'lines' ? '\n' : ', ');

const sameList = (a: readonly string[], b: readonly string[]) =>
  a.length === b.length && a.every((v, i) => v === b[i]);

const NO_ITEMS: readonly string[] = [];

interface ListTextFieldProps {
  label: string;
  value: readonly string[] | undefined;
  onChange: (value: string[]) => void;
  mode: 'lines' | 'comma';
  rows?: number;
  placeholder?: string;
  hint?: ReactNode;
}

/**
 * Edits a list of strings as text (one per line, or comma-separated). Keeps a
 * local draft so trailing separators survive while typing, and only resyncs
 * when the list changes from outside.
 */
export function ListTextField({ label, value, onChange, mode, rows, placeholder, hint }: ListTextFieldProps) {
  const id = useId();
  const items = value ?? NO_ITEMS;
  const [draft, setDraft] = useState(() => joinList(items, mode));

  useEffect(() => {
    setDraft((current) => (sameList(splitList(current, mode), items) ? current : joinList(items, mode)));
  }, [items, mode]);

  const handle = (text: string) => {
    setDraft(text);
    const next = splitList(text, mode);
    if (!sameList(next, items)) onChange(next);
  };

  return (
    <FieldShell
      label={label}
      id={id}
      wide
      hint={hint ?? (mode === 'lines' ? 'One item per line.' : 'Separate items with commas.')}
    >
      {mode === 'lines' ? (
        <textarea
          id={id}
          rows={rows ?? Math.min(8, Math.max(3, items.length + 1))}
          value={draft}
          placeholder={placeholder}
          onChange={(e) => handle(e.target.value)}
        />
      ) : (
        <input id={id} type="text" value={draft} placeholder={placeholder} onChange={(e) => handle(e.target.value)} />
      )}
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
