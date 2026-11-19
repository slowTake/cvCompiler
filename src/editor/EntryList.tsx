import { ArrowDown, ArrowUp, ChevronRight, Plus, Trash2 } from 'lucide-react';
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { insertAt, moveItem, removeAt, replaceAt } from '../model/list';
import { useToast } from '../ui/toast';
import { focusWithin, useEditFocus } from './editFocus';

interface EntryListProps<T extends { id: string }> {
  items: T[];
  onChange: (items: T[]) => void;
  create: () => T;
  /** e.g. "experience" → "Add experience". */
  noun: string;
  /** One-line label for the collapsed card. */
  summary: (item: T) => string;
  renderItem: (item: T, update: (next: T) => void) => ReactNode;
  /** Small lists (contacts, languages) render inline rows instead of cards. */
  compact?: boolean;
}

/** Add, remove, reorder and edit the entries of one list section. */
export function EntryList<T extends { id: string }>({
  items,
  onChange,
  create,
  noun,
  summary,
  renderItem,
  compact,
}: EntryListProps<T>) {
  const { notify } = useToast();
  const [open, setOpen] = useState<ReadonlySet<string>>(() => new Set());
  const listRef = useRef<HTMLDivElement>(null);
  const { target, done } = useEditFocus();

  // A click on one of our entries in the preview: expand it, then focus the field.
  const [focusing, setFocusing] = useState<{ entryId: string; field?: string } | null>(null);
  const targetId = target?.entryId;
  const owns = !!targetId && items.some((item) => item.id === targetId);
  useEffect(() => {
    if (!owns || !target?.entryId) return;
    const { entryId, field } = target;
    done();
    setOpen((current) => (current.has(entryId) ? current : new Set(current).add(entryId)));
    setFocusing({ entryId, field });
  }, [owns, target, done]);
  // Runs after the expanded body is in the DOM.
  useEffect(() => {
    if (!focusing) return;
    setFocusing(null);
    const el = listRef.current?.querySelector<HTMLElement>(`[data-entry-id="${CSS.escape(focusing.entryId)}"]`);
    if (el) focusWithin(el, focusing.field);
  }, [focusing]);

  // Undo runs later, from a toast. It must act on the list as it is then,
  // through the latest onChange, and do nothing once this list is gone
  // (the Editor remounts when a different document is loaded).
  const latest = useRef({ items, onChange });
  useLayoutEffect(() => {
    latest.current = { items, onChange };
  });
  const mounted = useRef(false);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const toggle = (id: string) =>
    setOpen((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const add = () => {
    const item = create();
    setOpen((current) => new Set(current).add(item.id));
    onChange([...items, item]);
  };

  const remove = (index: number) => {
    const removed = items[index];
    const label = summary(removed) || noun;
    onChange(removeAt(items, index));
    const undo = () => {
      if (!mounted.current) {
        notify('Nothing to undo: a different document is open now.');
        return;
      }
      const current = latest.current;
      if (current.items.some((item) => item.id === removed.id)) return;
      current.onChange(insertAt(current.items, index, removed));
    };
    notify(`Removed “${label}”`, { action: { label: 'Undo', run: undo } });
  };

  const controls = (index: number, label: string) => (
    <div className="ui-entry-controls">
      <button
        type="button"
        className="ui-icon-btn"
        aria-label={`Move ${label} up`}
        title="Move up"
        disabled={index === 0}
        onClick={() => onChange(moveItem(items, index, -1))}
      >
        <ArrowUp size={15} />
      </button>
      <button
        type="button"
        className="ui-icon-btn"
        aria-label={`Move ${label} down`}
        title="Move down"
        disabled={index === items.length - 1}
        onClick={() => onChange(moveItem(items, index, 1))}
      >
        <ArrowDown size={15} />
      </button>
      <button
        type="button"
        className="ui-icon-btn ui-danger"
        aria-label={`Remove ${label}`}
        title="Remove"
        onClick={() => remove(index)}
      >
        <Trash2 size={15} />
      </button>
    </div>
  );

  return (
    <div className={`ui-entry-list${compact ? ' ui-entry-list-compact' : ''}`} ref={listRef}>
      {items.length === 0 && <p className="ui-empty">Nothing here yet.</p>}
      {items.map((item, index) => {
        const label = summary(item).trim() || `New ${noun}`;
        const update = (next: T) => onChange(replaceAt(items, index, next));
        if (compact) {
          return (
            <div className="ui-entry-row" key={item.id} data-entry-id={item.id}>
              <div className="ui-entry-row-fields">{renderItem(item, update)}</div>
              {controls(index, label)}
            </div>
          );
        }
        const isOpen = open.has(item.id);
        return (
          <div className={`ui-entry${isOpen ? ' is-open' : ''}`} key={item.id} data-entry-id={item.id}>
            <div className="ui-entry-head">
              <button
                type="button"
                className="ui-entry-toggle"
                aria-expanded={isOpen}
                onClick={() => toggle(item.id)}
              >
                <ChevronRight size={16} className="ui-chevron" />
                <span className="ui-entry-summary">{label}</span>
              </button>
              {controls(index, label)}
            </div>
            {isOpen && <div className="ui-entry-body">{renderItem(item, update)}</div>}
          </div>
        );
      })}
      <button type="button" className="ui-btn ui-btn-ghost ui-add" onClick={add}>
        <Plus size={15} /> Add {noun}
      </button>
    </div>
  );
}
