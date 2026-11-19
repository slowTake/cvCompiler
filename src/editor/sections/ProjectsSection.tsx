import { FolderGit2 } from 'lucide-react';
import { newProject } from '../../model/defaults';
import { optional } from '../../model/list';
import type { ProjectEntry } from '../../model/types';
import { EntryList } from '../EntryList';
import { FieldRow, ListTextField, TagListField, TextArea, TextField } from '../fields';
import { FormSection, type SectionChrome } from '../FormSection';

interface Props extends SectionChrome {
  title: string;
  value: ProjectEntry[];
  onChange: (next: ProjectEntry[]) => void;
}

const orUndefined = (list: string[]) => (list.length > 0 ? list : undefined);

export function ProjectsSection({ title, value, onChange, ...chrome }: Props) {
  return (
    <FormSection id="projects" title={title} icon={FolderGit2} badge={value.length} {...chrome}>
      <EntryList
        noun="project"
        items={value}
        create={newProject}
        summary={(p) => p.name}
        onChange={onChange}
        renderItem={(p, update) => (
          <>
            <FieldRow>
              <TextField label="Name" field="name" value={p.name} onChange={(name) => update({ ...p, name })} />
              <TextField
                label="Role"
                field="role"
                value={p.role}
                placeholder="Lead developer"
                onChange={(role) => update({ ...p, role: optional(role) })}
              />
            </FieldRow>
            <FieldRow>
              <TextField
                label="Start"
                field="start"
                value={p.start}
                onChange={(start) => update({ ...p, start: optional(start) })}
              />
              <TextField label="End" value={p.end} onChange={(end) => update({ ...p, end: optional(end) })} />
            </FieldRow>
            <TextField
              label="URL"
              type="url"
              value={p.url}
              onChange={(url) => update({ ...p, url: optional(url) })}
            />
            <TextArea
              label="Summary"
              field="summary"
              rows={3}
              value={p.summary}
              onChange={(summary) => update({ ...p, summary: optional(summary) })}
            />
            <ListTextField
              label="Highlights"
              field="bullets"
              value={p.bullets}
              onChange={(bullets) => update({ ...p, bullets: orUndefined(bullets) })}
            />
            <TagListField
              label="Tech"
              field="tech"
              value={p.tech}
              onChange={(tech) => update({ ...p, tech: orUndefined(tech) })}
            />
          </>
        )}
      />
    </FormSection>
  );
}
