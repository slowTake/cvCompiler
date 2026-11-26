import { Check } from 'lucide-react';
import { createContext, useContext } from 'react';
import type { VersionTab } from '../model/versions';

interface VersionInclusion {
  versions: VersionTab[];
  activeId: string;
  isIncluded: (versionId: string, itemId: string) => boolean;
  toggle: (versionId: string, itemId: string) => void;
}

export const VersionsContext = createContext<VersionInclusion | null>(null);

export const useVersions = () => useContext(VersionsContext);

/** One chip per version; a lit chip means the entry appears in that version. */
export function IncludeIn({ itemId, label }: { itemId: string; label: string }) {
  const ctx = useVersions();
  if (!ctx) return null;
  return (
    <div className="ui-include" role="group" aria-label={`Versions that include ${label}`}>
      <span className="ui-include-label">Include in</span>
      {ctx.versions.map((v) => {
        const on = ctx.isIncluded(v.id, itemId);
        return (
          <button
            key={v.id}
            type="button"
            className={`ui-include-chip${on ? ' is-on' : ''}${v.id === ctx.activeId ? ' is-current' : ''}`}
            aria-pressed={on}
            title={on ? `In ${v.name}. Click to leave it out.` : `Left out of ${v.name}. Click to put it in.`}
            onClick={() => ctx.toggle(v.id, itemId)}
          >
            {on && <Check size={11} strokeWidth={3} />}
            {v.name}
          </button>
        );
      })}
    </div>
  );
}
