import { ArrowDown, ArrowUp, ChevronRight, Plus, Trash2 } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { moveItem, removeAt, replaceAt } from '../model/list';
import { useToast } from '../ui/toast';

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
    const before = items;
    const label = summary(items[index]) || noun;
    onChange(removeAt(items, index));
    notify(`Removed “${label}”`, { action: { label: 'Undo', run: () => onChange(before) } });
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
    <div className={`ui-entry-list${compact ? ' ui-entry-list-compact' : ''}`}>
      {items.length === 0 && <p className="ui-empty">Nothing here yet.</p>}
      {items.map((item, index) => {
        const label = summary(item).trim() || `New ${noun}`;
        const update = (next: T) => onChange(replaceAt(items, index, next));
        if (compact) {
          return (
            <div className="ui-entry-row" key={item.id}>
              <div className="ui-entry-row-fields">{renderItem(item, update)}</div>
              {controls(index, label)}
            </div>
          );
        }
        const isOpen = open.has(item.id);
        return (
          <div className={`ui-entry${isOpen ? ' is-open' : ''}`} key={item.id}>
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
