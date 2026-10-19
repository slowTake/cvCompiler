import {
  Briefcase,
  CodeXml,
  Globe,
  Link as LinkIcon,
  Mail,
  MapPin,
  Phone,
  type LucideIcon,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { CONTACT_KIND_LABELS, sectionTitle } from '../model/defaults';
import { contactHref, safeHref } from '../model/links';
import type {
  ContactKind,
  CvDocument,
  EducationEntry,
  ExperienceEntry,
  Identity,
  ProjectEntry,
  SectionConfig,
  SkillLink,
} from '../model/types';

const CONTACT_ICONS: Record<ContactKind, LucideIcon> = {
  email: Mail,
  phone: Phone,
  location: MapPin,
  website: Globe,
  linkedin: Briefcase,
  github: CodeXml,
  other: LinkIcon,
};

function MaybeLink({ href, children }: { href: string | undefined; children: ReactNode }) {
  if (!href) return <>{children}</>;
  return (
    <a className="cv-link" href={href} target="_blank" rel="noreferrer noopener">
      {children}
    </a>
  );
}

const hasText = (s: string | undefined): s is string => !!s && s.trim() !== '';

/** A label that only repeats the icon's meaning ("Email" on an email) is not shown. */
function showContactLabel(label: string | undefined, kind: ContactKind): label is string {
  return hasText(label) && label.trim().toLowerCase() !== CONTACT_KIND_LABELS[kind].toLowerCase();
}

function paragraphs(text: string): string[] {
  return text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}

export function IdentityBlock({ identity }: { identity: Identity }) {
  const contacts = identity.contact.filter((c) => hasText(c.value));
  const links = (identity.links ?? []).filter((l) => hasText(l.url));
  return (
    <header className="cv-identity">
      <div className="cv-name-block">
        <h1 className="cv-name">{identity.name || 'Your Name'}</h1>
        {hasText(identity.role) && <p className="cv-role">{identity.role}</p>}
        {hasText(identity.tagline) && <p className="cv-tagline">{identity.tagline}</p>}
      </div>
      {(contacts.length > 0 || links.length > 0) && (
        <ul className="cv-contact">
          {contacts.map((c) => {
            const Icon = CONTACT_ICONS[c.kind];
            return (
              <li className="cv-contact-item" key={c.id}>
                <span className="cv-icon" aria-hidden="true">
                  <Icon strokeWidth={2} />
                </span>
                {showContactLabel(c.label, c.kind) && <span className="cv-contact-label">{c.label}</span>}
                <MaybeLink href={contactHref(c)}>{c.value}</MaybeLink>
              </li>
            );
          })}
          {links.map((l) => (
            <li className="cv-contact-item" key={l.id}>
              <span className="cv-icon" aria-hidden="true">
                <LinkIcon strokeWidth={2} />
              </span>
              <MaybeLink href={safeHref(l.url)}>{l.label?.trim() || l.url}</MaybeLink>
            </li>
          ))}
        </ul>
      )}
    </header>
  );
}

/** A section whose heading travels with its first item; every item is an unbreakable block. */
function SectionShell({
  config,
  items,
}: {
  config: SectionConfig;
  items: { key: string; node: ReactNode }[];
}) {
  if (items.length === 0) return null;
  const [first, ...rest] = items;
  return (
    <section className={`cv-section cv-section-${config.id}`}>
      <div className="cv-block">
        <h2 className="cv-heading">{sectionTitle(config)}</h2>
        {first.node}
      </div>
      {rest.map((item) => (
        <div className="cv-block" key={item.key}>
          {item.node}
        </div>
      ))}
    </section>
  );
}

function Tags({
  label,
  items,
  links,
}: {
  label?: string;
  items: string[] | undefined;
  /** Chips whose text matches a link's `skill` become links. */
  links?: SkillLink[];
}) {
  const list = (items ?? []).filter(hasText);
  if (list.length === 0) return null;
  const hrefFor = (tag: string) => safeHref(links?.find((l) => l.skill.trim() === tag.trim())?.url);
  return (
    <div className="cv-tags">
      {label && <span className="cv-tags-label">{label}</span>}
      {list.map((t, i) => (
        <span className="cv-chip" key={`${i}-${t}`}>
          <MaybeLink href={hrefFor(t)}>{t}</MaybeLink>
        </span>
      ))}
    </div>
  );
}

function Bullets({ items }: { items: string[] | undefined }) {
  const list = (items ?? []).filter(hasText);
  if (list.length === 0) return null;
  return (
    <ul className="cv-bullets">
      {list.map((b, i) => (
        <li key={`${i}-${b.slice(0, 16)}`}>{b}</li>
      ))}
    </ul>
  );
}

export function dateRange(start?: string, end?: string): string | undefined {
  const s = start?.trim();
  const e = end?.trim();
  if (s && e) return s === e ? s : `${s} – ${e}`;
  return s || e || undefined;
}

function EntryHead({
  name,
  org,
  href,
  orgHref,
  dates,
  location,
}: {
  name: string;
  org?: string;
  href?: string;
  orgHref?: string;
  dates?: string;
  location?: string;
}) {
  return (
    <div className="cv-entry-head">
      <div className="cv-entry-title">
        <h3 className="cv-entry-name">
          <MaybeLink href={href}>{name}</MaybeLink>
        </h3>
        {hasText(org) && (
          <span className="cv-entry-org">
            <MaybeLink href={orgHref}>{org}</MaybeLink>
          </span>
        )}
      </div>
      {(dates || hasText(location)) && (
        <div className="cv-entry-meta">
          {dates && <span className="cv-date">{dates}</span>}
          {hasText(location) && <span className="cv-location">{location}</span>}
        </div>
      )}
    </div>
  );
}

function ExperienceItem({ entry }: { entry: ExperienceEntry }) {
  return (
    <article className="cv-entry">
      <EntryHead
        name={entry.title || 'Role'}
        org={entry.org}
        orgHref={safeHref(entry.orgHref)}
        dates={dateRange(entry.start, entry.end)}
        location={entry.location}
      />
      <Bullets items={entry.bullets} />
      <Tags label="Skills developed" items={entry.skills} />
    </article>
  );
}

function ProjectItem({ entry }: { entry: ProjectEntry }) {
  return (
    <article className="cv-entry">
      <EntryHead
        name={entry.name || 'Project'}
        org={entry.role}
        href={safeHref(entry.url)}
        dates={dateRange(entry.start, entry.end)}
      />
      {hasText(entry.summary) && <p className="cv-text">{entry.summary}</p>}
      <Bullets items={entry.bullets} />
      <Tags items={entry.tech} />
    </article>
  );
}

function EducationItem({ entry }: { entry: EducationEntry }) {
  const hasDegree = hasText(entry.degree);
  const orgHref = safeHref(entry.orgHref);
  return (
    <article className="cv-entry">
      <EntryHead
        name={(hasDegree ? entry.degree : entry.institution) || 'Institution'}
        org={hasDegree ? entry.institution : undefined}
        href={hasDegree ? undefined : orgHref}
        orgHref={hasDegree ? orgHref : undefined}
        dates={dateRange(entry.start, entry.end)}
        location={entry.location}
      />
      <Bullets items={entry.details} />
      <Tags label="Skills developed" items={entry.skills} />
    </article>
  );
}

/** Renders one CV section by id, or nothing when it has no content. */
export function CvSection({ config, doc }: { config: SectionConfig; doc: CvDocument }) {
  switch (config.id) {
    case 'about': {
      const about = doc.identity.about;
      if (!hasText(about)) return null;
      return (
        <SectionShell
          config={config}
          items={[
            {
              key: 'about',
              node: (
                <div className="cv-about">
                  {paragraphs(about).map((p, i) => (
                    <p className="cv-text" key={i}>
                      {p}
                    </p>
                  ))}
                </div>
              ),
            },
          ]}
        />
      );
    }
    case 'skills':
      return (
        <SectionShell
          config={config}
          items={doc.skills
            .filter((g) => hasText(g.name) || g.items.some(hasText))
            .map((g) => ({
              key: g.id,
              node: (
                <div className="cv-skill-group">
                  {hasText(g.name) && <h3 className="cv-skill-group-name">{g.name}</h3>}
                  <Tags items={g.items} links={g.links} />
                </div>
              ),
            }))}
        />
      );
    case 'experience':
      return (
        <SectionShell
          config={config}
          items={doc.experience.map((e) => ({ key: e.id, node: <ExperienceItem entry={e} /> }))}
        />
      );
    case 'projects':
      return (
        <SectionShell
          config={config}
          items={doc.projects.map((p) => ({ key: p.id, node: <ProjectItem entry={p} /> }))}
        />
      );
    case 'education':
      return (
        <SectionShell
          config={config}
          items={doc.education.map((e) => ({ key: e.id, node: <EducationItem entry={e} /> }))}
        />
      );
    case 'languages': {
      const langs = doc.languages.filter((l) => hasText(l.name));
      if (langs.length === 0) return null;
      return (
        <SectionShell
          config={config}
          items={[
            {
              key: 'languages',
              node: (
                <ul className="cv-languages">
                  {langs.map((l) => (
                    <li className="cv-language" key={l.id}>
                      <span className="cv-language-name">{l.name}</span>
                      {hasText(l.level) && <span className="cv-language-level">{l.level}</span>}
                    </li>
                  ))}
                </ul>
              ),
            },
          ]}
        />
      );
    }
  }
}
