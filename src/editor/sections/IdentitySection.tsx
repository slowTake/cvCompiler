import { User } from 'lucide-react';
import { newContact, newLink } from '../../model/defaults';
import { optional } from '../../model/list';
import { CONTACT_KINDS, type ContactKind, type Identity } from '../../model/types';
import { EntryList } from '../EntryList';
import { FieldRow, SelectField, TextArea, TextField } from '../fields';
import { FormSection, type SectionChrome } from '../FormSection';

const KIND_LABELS: Record<ContactKind, string> = {
  email: 'Email',
  phone: 'Phone',
  location: 'Location',
  website: 'Website',
  linkedin: 'LinkedIn',
  github: 'GitHub',
  other: 'Other',
};

const KIND_OPTIONS = CONTACT_KINDS.map((k) => ({ value: k, label: KIND_LABELS[k] }));

interface Props extends SectionChrome {
  value: Identity;
  onChange: (next: Identity) => void;
}

export function IdentitySection({ value, onChange, ...chrome }: Props) {
  const links = value.links ?? [];
  return (
    <FormSection id="identity" title="Identity" icon={User} {...chrome}>
      <FieldRow>
        <TextField label="Name" field="name" value={value.name} onChange={(name) => onChange({ ...value, name })} />
        <TextField
          label="Role"
          field="role"
          value={value.role}
          placeholder="e.g. Product Engineer"
          onChange={(role) => onChange({ ...value, role: optional(role) })}
        />
      </FieldRow>
      <TextArea
        label="About"
        field="about"
        rows={5}
        value={value.about}
        hint="Shown in the About section. Leave a blank line between paragraphs."
        onChange={(about) => onChange({ ...value, about: optional(about) })}
      />

      <h3 className="ui-subhead">Contact</h3>
      <EntryList
        compact
        noun="contact"
        items={value.contact}
        create={newContact}
        summary={(c) => c.value}
        onChange={(contact) => onChange({ ...value, contact })}
        renderItem={(c, update) => (
          <>
            <SelectField
              label="Kind"
              value={c.kind}
              options={KIND_OPTIONS}
              onChange={(kind) => update({ ...c, kind })}
            />
            <TextField label="Value" value={c.value} onChange={(v) => update({ ...c, value: v })} />
          </>
        )}
      />

      <h3 className="ui-subhead">Links</h3>
      <EntryList
        compact
        noun="link"
        items={links}
        create={newLink}
        summary={(l) => l.label ?? l.url}
        onChange={(next) => onChange({ ...value, links: next.length > 0 ? next : undefined })}
        renderItem={(l, update) => (
          <>
            <TextField
              label="Label"
              value={l.label}
              placeholder="Portfolio"
              onChange={(label) => update({ ...l, label: optional(label) })}
            />
            <TextField label="URL" value={l.url} type="url" onChange={(url) => update({ ...l, url })} />
          </>
        )}
      />
    </FormSection>
  );
}
