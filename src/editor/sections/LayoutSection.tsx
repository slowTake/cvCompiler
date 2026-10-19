import { ArrowDown, ArrowUp, Eye, EyeOff, ListOrdered } from 'lucide-react';
import { SECTION_LABELS } from '../../model/defaults';
import { moveItem, optional, replaceAt } from '../../model/list';
import type { CvMeta } from '../../model/types';
import { TextField } from '../fields';
import { FormSection, type SectionChrome } from '../FormSection';

interface Props extends SectionChrome {
  value: CvMeta;
  onChange: (next: CvMeta) => void;
  /** Sections the current skeleton puts in its sidebar. */
  sidebarSections: readonly string[];
}

export function LayoutSection({ value, onChange, sidebarSections, ...chrome }: Props) {
  const sections = value.sections;
  const setSections = (next: CvMeta['sections']) => onChange({ ...value, sections: next });

  return (
    <FormSection id="layout" title="Document & sections" icon={ListOrdered} {...chrome}>
      <TextField
        label="Document title"
        value={value.title}
        hint="Used for the file name and the default PDF name."
        onChange={(title) => onChange({ ...value, title })}
      />
      <h3 className="ui-subhead">Sections</h3>
      <p className="ui-hint">Show, hide, rename and reorder the sections of your CV.</p>
      <ol className="ui-section-list">
        {sections.map((s, i) => (
          <li key={s.id} className={s.visible ? '' : 'is-hidden'}>
            <button
              type="button"
              className="ui-icon-btn"
              aria-pressed={s.visible}
              aria-label={`${s.visible ? 'Hide' : 'Show'} ${SECTION_LABELS[s.id]}`}
              title={s.visible ? 'Visible: click to hide' : 'Hidden: click to show'}
              onClick={() => setSections(replaceAt(sections, i, { ...s, visible: !s.visible }))}
            >
              {s.visible ? <Eye size={15} /> : <EyeOff size={15} />}
            </button>
            <input
              type="text"
              aria-label={`Heading for ${SECTION_LABELS[s.id]}`}
              value={s.title ?? ''}
              placeholder={SECTION_LABELS[s.id]}
              onChange={(e) => {
                const next = { ...s, title: optional(e.target.value) };
                if (next.title === undefined) delete next.title;
                setSections(replaceAt(sections, i, next));
              }}
            />
            {sidebarSections.includes(s.id) && <span className="ui-tag">sidebar</span>}
            <button
              type="button"
              className="ui-icon-btn"
              aria-label={`Move ${SECTION_LABELS[s.id]} up`}
              disabled={i === 0}
              onClick={() => setSections(moveItem(sections, i, -1))}
            >
              <ArrowUp size={15} />
            </button>
            <button
              type="button"
              className="ui-icon-btn"
              aria-label={`Move ${SECTION_LABELS[s.id]} down`}
              disabled={i === sections.length - 1}
              onClick={() => setSections(moveItem(sections, i, 1))}
            >
              <ArrowDown size={15} />
            </button>
          </li>
        ))}
      </ol>
    </FormSection>
  );
}
