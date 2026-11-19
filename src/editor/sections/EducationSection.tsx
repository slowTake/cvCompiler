import { GraduationCap } from 'lucide-react';
import { newEducation } from '../../model/defaults';
import { optional } from '../../model/list';
import type { EducationEntry } from '../../model/types';
import { EntryList } from '../EntryList';
import { FieldRow, ListTextField, TextField } from '../fields';
import { FormSection, type SectionChrome } from '../FormSection';

interface Props extends SectionChrome {
  title: string;
  value: EducationEntry[];
  onChange: (next: EducationEntry[]) => void;
}

export function EducationSection({ title, value, onChange, ...chrome }: Props) {
  return (
    <FormSection id="education" title={title} icon={GraduationCap} badge={value.length} {...chrome}>
      <EntryList
        noun="education"
        items={value}
        create={newEducation}
        summary={(e) => [e.degree, e.institution].filter(Boolean).join(' · ')}
        onChange={onChange}
        renderItem={(e, update) => (
          <>
            <FieldRow>
              <TextField
                label="Institution"
                field="institution"
                value={e.institution}
                onChange={(institution) => update({ ...e, institution })}
              />
              <TextField
                label="Degree"
                field="degree"
                value={e.degree}
                onChange={(degree) => update({ ...e, degree: optional(degree) })}
              />
            </FieldRow>
            <FieldRow>
              <TextField
                label="Start"
                field="start"
                value={e.start}
                onChange={(start) => update({ ...e, start: optional(start) })}
              />
              <TextField label="End" value={e.end} onChange={(end) => update({ ...e, end: optional(end) })} />
            </FieldRow>
            <TextField
              label="Location"
              field="location"
              value={e.location}
              onChange={(location) => update({ ...e, location: optional(location) })}
            />
            <ListTextField
              label="Details"
              field="details"
              value={e.details}
              onChange={(details) => update({ ...e, details: details.length > 0 ? details : undefined })}
            />
          </>
        )}
      />
    </FormSection>
  );
}
