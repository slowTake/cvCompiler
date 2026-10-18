# Domain glossary (cvStudio)

Shared vocabulary for agents and contributors. Prefer these terms in code, docs, and PRs.

| Term | Meaning |
|------|---------|
| **CvDocument** | The structured JSON CV (identity, skills, education, projects, experience, languages, section flags). Source of truth for form + preview. |
| **Template** | A pairing of a **LayoutSkeleton** and a **Theme** applied to a `CvDocument`. Selected in the toolbar; resolved via the template registry. |
| **LayoutSkeleton** | The structural arrangement of a CV (e.g. sidebar-left two-column, single-column/ATS, header-band). A small fixed set (target 2–3). Owns *structure*, not colors/fonts. |
| **Theme** | A named set of design tokens (font family, color palette, accent, spacing/density, header treatment) applied over a LayoutSkeleton. Many themes can share one skeleton. |
| **TemplateId** | String id on `meta.templateId`. Resolved via the template registry; a template is a precomposed (skeleton × theme) entry unless decided otherwise. |
| **Persistence** | How CV data survives sessions: **localStorage** (fast autosave/cache) + a **BoundFile** (durable copy) + JSON import/export. No accounts or server DB. |
| **BoundFile** | A user-chosen `.json` on disk that **Save** writes back to via the File System Access API (Chromium). The durable source of truth; localStorage is a cache. Falls back to Export JSON where the API is unavailable. |
| **TemplateGallery** | The template picker: a modal grid showing the user's own CV rendered live in each precomposed, named template, filterable by skeleton. Each maps internally to a (LayoutSkeleton × Theme). |
| **StyleOverrides** | Optional `meta.style` tweaks (accent, font pairing, density, heading case, sidebar width, type size) layered over the active Theme. Stored in the document, so they travel with the JSON and print identically everywhere (ADR 0007). Edited in the **Design tab**. |
| **Export** | Download `CvDocument` as JSON, and/or browser **Print → Save as PDF**. |
| **Import** | Load a `CvDocument` from a JSON file into the editor (replaces current doc). |
| **DemoSeed** | Fictional public seed (`data/cv.public.json`) shipped in production builds. |
| **PrivateSeed** | Owner-only `data/cv.private.json` (gitignored). Loaded in **dev only**; never bundled into production. |
| **Studio template** | The monospace two-column / pink-accent layout (default v1 template). |

## Related docs

- Decisions: [docs/DECISIONS.md](./docs/DECISIONS.md)
- ADRs: [docs/adr/](./docs/adr/)
- Schema: [docs/DATA-MODEL.md](./docs/DATA-MODEL.md)
- Deploy: [docs/DEPLOY.md](./docs/DEPLOY.md)
