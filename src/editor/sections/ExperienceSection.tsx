import { Briefcase } from 'lucide-react';
import { newExperience } from '../../model/defaults';
import { optional } from '../../model/list';
import type { ExperienceEntry } from '../../model/types';
import { EntryList } from '../EntryList';
import { FieldRow, ListTextField, TagListField, TextField } from '../fields';
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
              <TextField label="Title" value={e.title} onChange={(title) => update({ ...e, title })} />
              <TextField label="Organisation" value={e.org} onChange={(org) => update({ ...e, org })} />
            </FieldRow>
            <TextField
              label="Organisation link"
              type="url"
              value={e.orgHref}
              onChange={(orgHref) => update({ ...e, orgHref: optional(orgHref) })}
            />
            <FieldRow>
              <TextField
                label="Start"
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
              value={e.location}
              onChange={(location) => update({ ...e, location: optional(location) })}
            />
            <ListTextField
              label="Highlights"
              value={e.bullets}
              onChange={(bullets) => update({ ...e, bullets })}
            />
            <TagListField
              label="Skills developed"
              value={e.skills}
              onChange={(skills) => update({ ...e, skills: skills.length > 0 ? skills : undefined })}
            />
          </>
        )}
      />
    </FormSection>
  );
}
