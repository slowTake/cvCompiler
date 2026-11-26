import { Plus, X } from 'lucide-react';
import { useState } from 'react';
import { ORIGINAL_VERSION_ID, type VersionTab } from '../model/versions';

interface Props {
  tabs: VersionTab[];
  activeId: string;
  onSelect: (id: string) => void;
  /** Adds a copy of the active version. */
  onAdd: () => void;
  onRename: (id: string, name: string) => void;
  onRemove: (id: string) => void;
}

/** Browser-style tabs: one per version of the CV, plus "+" for a new copy. */
export function VersionTabs({ tabs, activeId, onSelect, onAdd, onRename, onRemove }: Props) {
  const [editing, setEditing] = useState<string | null>(null);
  const activeName = tabs.find((t) => t.id === activeId)?.name ?? '';

  return (
    <div className="ui-version-tabs" role="tablist" aria-label="CV versions">
      {tabs.map((tab) => {
        const active = tab.id === activeId;
        const original = tab.id === ORIGINAL_VERSION_ID;
        return (
          <div key={tab.id} className={`ui-version-tab${active ? ' is-active' : ''}`}>
            {editing === tab.id ? (
              <input
                className="ui-version-tab-input"
                aria-label="Version name"
                defaultValue={tab.name}
                autoFocus
                onFocus={(e) => e.currentTarget.select()}
                onBlur={(e) => {
                  onRename(tab.id, e.currentTarget.value);
                  setEditing(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') e.currentTarget.blur();
                  if (e.key === 'Escape') setEditing(null);
                }}
              />
            ) : (
              <button
                type="button"
                role="tab"
                aria-selected={active}
                className="ui-version-tab-name"
                title={original ? 'The original CV' : `${tab.name}. Double-click to rename.`}
                onClick={() => onSelect(tab.id)}
                onDoubleClick={() => !original && setEditing(tab.id)}
              >
                {tab.name}
              </button>
            )}
            {!original && editing !== tab.id && (
              <button
                type="button"
                className="ui-version-tab-close"
                aria-label={`Delete ${tab.name}`}
                title={`Delete ${tab.name}`}
                onClick={() => {
                  if (window.confirm(`Delete “${tab.name}”? Its design and selection go; the content stays.`)) {
                    onRemove(tab.id);
                  }
                }}
              >
                <X size={13} />
              </button>
            )}
          </div>
        );
      })}
      <button
        type="button"
        className="ui-version-add"
        aria-label="New version"
        title={`New version: a copy of ${activeName}`}
        onClick={onAdd}
      >
        <Plus size={16} />
      </button>
    </div>
  );
}
