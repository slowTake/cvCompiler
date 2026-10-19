import { Wrench } from 'lucide-react';
import { newSkillGroup, newSkillLink } from '../../model/defaults';
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
              value={g.name}
              placeholder="e.g. Frontend"
              onChange={(name) => update({ ...g, name })}
            />
            <TagListField
              label="Skills"
              value={g.items}
              placeholder="React, TypeScript, CSS"
              onChange={(items) => update({ ...g, items })}
            />
            <h4 className="ui-subhead">Skill links</h4>
            <EntryList
              compact
              noun="skill link"
              items={g.links ?? []}
              create={newSkillLink}
              summary={(l) => l.skill || l.url}
              onChange={(links) => update({ ...g, links: links.length > 0 ? links : undefined })}
              renderItem={(l, updateLink) => (
                <>
                  <TextField
                    label="Skill"
                    value={l.skill}
                    placeholder="React"
                    hint="Must match a skill above exactly."
                    onChange={(skill) => updateLink({ ...l, skill })}
                  />
                  <TextField
                    label="URL"
                    type="url"
                    value={l.url}
                    onChange={(url) => updateLink({ ...l, url })}
                  />
                </>
              )}
            />
          </>
        )}
      />
    </FormSection>
  );
}
