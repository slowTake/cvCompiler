import { Wrench } from 'lucide-react';
import { newSkillGroup } from '../../model/defaults';
import type { SkillGroup } from '../../model/types';
import { EntryList } from '../EntryList';
import { TagListField, TextField } from '../fields';
import { FormSection, type SectionChrome } from '../FormSection';

interface Props extends SectionChrome {
  title: string;
  value: SkillGroup[];
  onChange: (next: SkillGroup[]) => void;
}

export function SkillsSection({ title, value, onChange, ...chrome }: Props) {
  return (
    <FormSection id="skills" title={title} icon={Wrench} badge={value.length} {...chrome}>
      <EntryList
        noun="skill group"
        items={value}
        create={newSkillGroup}
        summary={(g) => g.name || g.items.slice(0, 3).join(', ')}
        onChange={onChange}
        renderItem={(g, update) => (
          <>
            <TextField
              label="Group name"
              field="name"
              value={g.name}
              placeholder="e.g. Frontend"
              onChange={(name) => update({ ...g, name })}
            />
            <TagListField
              label="Skills"
              field="items"
              value={g.items}
              placeholder="React, TypeScript, CSS"
              onChange={(items) => update({ ...g, items })}
            />
          </>
        )}
      />
    </FormSection>
  );
}
