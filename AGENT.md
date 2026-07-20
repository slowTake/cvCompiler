# Agent brief: cvStudio

Use this file as the source of truth for local or **cloud** agents working in this repository.

## Mission

**cvStudio**: Vite + React + TypeScript app — edit a `CvDocument` in a form, live A4 preview via a **template registry**, persist with **localStorage + Import/Export JSON**, print styled PDF in the browser.

## Current repo state

- Product name: **cvStudio** (GitHub may still be `cvCompiler`)
- Deploy target: Cloudflare Pages → **`cv.peternurmi.com`** (see [docs/DEPLOY.md](./docs/DEPLOY.md))
- Work in this repository root

## Locked decisions

See [docs/DECISIONS.md](./docs/DECISIONS.md) and [CONTEXT.md](./CONTEXT.md). Highlights:

1. No accounts / no DB — localStorage + JSON import/export
2. PDF is **print output only** (no PDF import)
3. `meta.templateId` + registry; v1 template = `studio`
4. Production: public demo seed (or imported JSON); never bundle `cv.private.json`
5. No Public/Private toggle or Reset seed

## Out of scope

See [docs/OUT-OF-SCOPE.md](./docs/OUT-OF-SCOPE.md).

## Cloud agent notes

- Do **not** commit `data/cv.private.json`
- Do **not** copy real PII into `cv.public.json` or production bundles
- After `npm run build`, verify private strings are absent from `dist/`
- Target **Node 18.18+** (see `.nvmrc`)

## Definition of done (deploy prep)

- [ ] Template picker + `meta.templateId`
- [ ] Import + Export JSON
- [ ] Prod hides Private toggle; private file not in `dist`
- [ ] DEPLOY.md documents Cloudflare + `cv.peternurmi.com`
- [ ] Docs/ADRs current

## Cursor skills

See [.cursor/skills/README.md](./.cursor/skills/README.md). Prefer **cv-studio** for app work.
