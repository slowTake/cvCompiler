import { Languages } from 'lucide-react';
import { newLanguage } from '../../model/defaults';
import { optional } from '../../model/list';
import type { LanguageEntry } from '../../model/types';
import { EntryList } from '../EntryList';
import { TextField } from '../fields';
import { FormSection, type SectionChrome } from '../FormSection';

interface Props extends SectionChrome {
  title: string;
  value: LanguageEntry[];
  onChange: (next: LanguageEntry[]) => void;
}

export function LanguagesSection({ title, value, onChange, ...chrome }: Props) {
  return (
    <FormSection id="languages" title={title} icon={Languages} badge={value.length} {...chrome}>
      <EntryList
        compact
        noun="language"
        items={value}
        create={newLanguage}
        summary={(l) => l.name}
        onChange={onChange}
        renderItem={(l, update) => (
          <>
            <TextField label="Language" field="name" value={l.name} onChange={(name) => update({ ...l, name })} />
            <TextField
              label="Level"
              field="level"
              value={l.level}
              placeholder="Fluent, B2, Native…"
              onChange={(level) => update({ ...l, level: optional(level) })}
            />
          </>
        )}
      />
    </FormSection>
  );
}
