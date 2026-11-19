import { Briefcase } from 'lucide-react';
import { newExperience } from '../../model/defaults';
import { optional } from '../../model/list';
import type { ExperienceEntry } from '../../model/types';
import { EntryList } from '../EntryList';
import { DESCRIPTION_HINT, DESCRIPTION_PLACEHOLDER, FieldRow, TagListField, TextArea, TextField } from '../fields';
import { FormSection, type SectionChrome } from '../FormSection';

interface Props extends SectionChrome {
  title: string;
  value: ExperienceEntry[];
  onChange: (next: ExperienceEntry[]) => void;
}

export function ExperienceSection({ title, value, onChange, ...chrome }: Props) {
  return (
    <FormSection id="experience" title={title} icon={Briefcase} badge={value.length} {...chrome}>
      <EntryList
        noun="position"
        items={value}
        create={newExperience}
        summary={(e) => [e.title, e.org].filter(Boolean).join(' · ')}
        onChange={onChange}
        renderItem={(e, update) => (
          <>
            <FieldRow>
              <TextField label="Title" field="title" value={e.title} onChange={(title) => update({ ...e, title })} />
              <TextField label="Organisation" field="org" value={e.org} onChange={(org) => update({ ...e, org })} />
            </FieldRow>
            <FieldRow>
              <TextField
                label="Start"
                field="start"
                value={e.start}
                placeholder="2021"
                onChange={(start) => update({ ...e, start: optional(start) })}
              />
              <TextField
                label="End"
                value={e.end}
                placeholder="Present"
                onChange={(end) => update({ ...e, end: optional(end) })}
              />
            </FieldRow>
            <TextField
              label="Location"
              field="location"
              value={e.location}
              onChange={(location) => update({ ...e, location: optional(location) })}
            />
            <TextArea
              label="Description"
              field="description"
              rows={6}
              value={e.description}
              placeholder={DESCRIPTION_PLACEHOLDER}
              hint={DESCRIPTION_HINT}
              rich
              onChange={(description) => update({ ...e, description: optional(description) })}
            />
            <TagListField
              label="Skills developed"
              field="skills"
              value={e.skills}
              onChange={(skills) => update({ ...e, skills: skills.length > 0 ? skills : undefined })}
            />
          </>
        )}
      />
    </FormSection>
  );
}
