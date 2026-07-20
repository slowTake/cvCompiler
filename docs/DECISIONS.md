# Decisions

Locked during grill-me / grill-with-docs sessions. Change only with an explicit product decision (prefer a new ADR).

| ID | Topic | Decision |
|----|--------|----------|
| D01 | Audience | Personal tool + portfolio demo. No multi-user auth. |
| D02 | MVP export | Styled visual PDF via print. No ATS template shipped yet (registry ready). |
| D03 | Runtime | Local-first; production demo on Cloudflare Pages. |
| D04 | Data privacy | Public seed committed; private JSON gitignored and **dev-only**. |
| D05 | Editing | Form UI is the primary editor; writes `CvDocument` JSON. |
| D06 | PDF pipeline | HTML/CSS → print CSS → browser Print → Save as PDF. **No PDF import.** |
| D07 | Stack | Vite + React + TypeScript. |
| D08 | Profiles | Single CV profile. Section toggle/reorder OK. |
| D09 | Visual fidelity | Close clone of studio layout; not pixel-perfect chrome. |
| D10 | PDF UX | Browser print. Playwright optional later. |
| D11 | Datasets | **Dev:** private default + public toggle. **Prod:** public/demo seed only. |
| D12 | App layout | Split view: form \| live A4 preview. |
| D13 | Naming | Product **cvStudio** (repo may still be `cvCompiler`). |
| D14 | Public seed | Fictional placeholder only. |
| D15 | Deploy | Cloudflare Pages → **`cv.peternurmi.com`** (Git UI build). |
| D16 | Persistence | localStorage + Import/Export JSON (ADR 0001). |
| D17 | Templates | `meta.templateId` + registry; v1 = `studio` (ADR 0003). |

## Rationale (short)

- **Local-only:** Keeps the demo static and private-data-safe.
- **JSON in/out:** Portable backup without a backend.
- **Template registry:** Expand layouts later without forking the form.
- **Cloudflare subdomain:** Simple static deploy beside the portfolio.

See also [CONTEXT.md](../CONTEXT.md) and [docs/adr/](./adr/).
