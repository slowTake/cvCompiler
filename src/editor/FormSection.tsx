import { ChevronRight, type LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

export interface FormSectionProps {
  id: string;
  title: string;
  icon: LucideIcon;
  open: boolean;
  onToggle: (id: string) => void;
  /** Short status shown next to the title, e.g. an entry count. */
  badge?: ReactNode;
  children: ReactNode;
}

export const formSectionDomId = (id: string) => `form-${id}`;

export function FormSection({ id, title, icon: Icon, open, onToggle, badge, children }: FormSectionProps) {
  const bodyId = `${formSectionDomId(id)}-body`;
  return (
    <section id={formSectionDomId(id)} className={`ui-form-section${open ? ' is-open' : ''}`}>
      <h2 className="ui-form-section-head">
        <button type="button" aria-expanded={open} aria-controls={bodyId} onClick={() => onToggle(id)}>
          <ChevronRight size={16} className="ui-chevron" />
          <Icon size={16} className="ui-form-section-icon" />
          <span>{title}</span>
          {badge !== undefined && <span className="ui-badge">{badge}</span>}
        </button>
      </h2>
      {open && (
        <div id={bodyId} className="ui-form-section-body">
          {children}
        </div>
      )}
    </section>
  );
}

/** Props every section editor receives from the Editor. */
export interface SectionChrome {
  open: boolean;
  onToggle: (id: string) => void;
}
