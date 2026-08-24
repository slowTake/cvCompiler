# CV data model

Source of truth: JSON files under `data/`.

| File | Git | Purpose |
|------|-----|---------|
| `data/cv.public.json` | Tracked | Fictional (or explicitly public-safe) demo for portfolio |
| `data/cv.private.json` | **Ignored** | Owner’s real CV for local PDF export |
| `data/cv.private.example.json` | Tracked | Template to copy → `cv.private.json` |

Both runtime files share the same schema. Default `meta.templateId` is **`studio`** ([adr/0003-template-registry.md](./adr/0003-template-registry.md)).

## Schema (v1)

```ts
type CvDocument = {
  meta: {
    title: string;          // e.g. "Software Developer"
    locale?: string;        // e.g. "en"
    updatedAt?: string;     // ISO date
    templateId?: string;    // registry id; default "studio"
  };
  identity: {
    name: string;
    role: string;
    tagline?: string;       // optional one-liner, distinct from about (Phase 3)
    contact: ContactItem[];
    links?: LinkItem[];     // optional social/portfolio row (Phase 3)
    about: string;
  };
  skills: SkillGroup[];
  education: EducationItem[];
  projects: ProjectItem[];
  experience: ExperienceItem[];
  languages: LanguageItem[];
  /** Optional ordered list of section ids for toggle/reorder */
  sectionOrder?: SectionId[];
  sectionsEnabled?: Partial<Record<SectionId, boolean>>;
};

type SectionId =
  | "about"
  | "skills"
  | "education"
  | "projects"
  | "experience"
  | "languages";

type ContactItem = {
  id: string;
  type: "email" | "phone" | "location" | "link";
  label: string;
  value: string;
  href?: string;
  icon?: string; // lucide (or similar) icon name
};

type SkillGroup = {
  id: string;
  title: string;       // e.g. "Soft Skills", "Tools"
  items: SkillItem[];
};

type SkillItem = {
  id: string;
  label: string;
  href?: string;
};

type LinkItem = {   // Phase 3 — optional, text-only (no binary/photo data)
  id: string;
  label: string;
  href: string;
};

type EducationItem = {
  id: string;
  title: string;       // program / degree
  org: string;
  orgHref?: string;
  start: string;       // "2023" or "2023-09"
  end: string;         // "present" or year
  location?: string;
  summary?: string;
  skillsDeveloped?: string[];
};

type ProjectItem = {
  id: string;
  title: string;
  href?: string;
  start?: string;
  end?: string;
  summary: string;
  stack?: string[];
};

type ExperienceItem = {
  id: string;
  title: string;       // role
  org: string;
  orgHref?: string;
  start: string;
  end: string;
  location?: string;
  skillsDeveloped?: string[];
  bullets: string[];   // short paragraphs or bullet strings
};

type LanguageItem = {
  id: string;
  name: string;
  level: string;       // e.g. "native", "bilingual", "conversational"
};
```

## Rules

- IDs are stable strings (cuid/ulid/uuid); forms should not regenerate on every keystroke after create.
- Dates are display strings for v1 (no strict date picker required).
- `skillsDeveloped` renders as an underlined “Skills developed:” line when present.
- Public file must not contain real private phone/email unless the owner deliberately wants them public.
