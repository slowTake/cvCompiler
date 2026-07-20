# Domain glossary (cvStudio)

Shared vocabulary for agents and contributors. Prefer these terms in code, docs, and PRs.

| Term | Meaning |
|------|---------|
| **CvDocument** | The structured JSON CV (identity, skills, education, projects, experience, languages, section flags). Source of truth for form + preview. |
| **Template** | A visual renderer + styles for a `CvDocument`. Does not change the form schema. |
| **TemplateId** | String id on `meta.templateId` (e.g. `"studio"`). Resolved via the template registry. |
| **Persistence** | How CV data survives sessions: browser **localStorage** + optional **JSON file** import/export. No accounts or server DB. |
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
