# Agent brief: cvStudio

Use this file as the source of truth for local or **cloud** agents working in this repository.

## Mission

Scaffold and implement **cvStudio**: a personal Vite + React + TypeScript app where the owner edits CV data via a form, sees a live A4 preview, and exports a styled PDF with **browser Print → Save as PDF**.

## Current repo state

- Product name: **cvStudio**
- This clone may still live under folder/remote name `cvCompiler`
- GitHub remote target rename: `slowTake/cvCompiler` → `slowTake/cvStudio` (only if the human asks / confirms in-session)
- Repo may be empty of app code; docs under `docs/` and this file define the MVP
- Work **in this repository root** (do not assume `~/Projects/cvStudio`)

## Locked decisions

Full table: [docs/DECISIONS.md](./docs/DECISIONS.md). Summary:

1. Personal use only (portfolio piece + personal tool)
2. Styled PDF only in v1 (no ATS export)
3. Local-first; deploy deferred
4. `data/cv.public.json` (committed) + `data/cv.private.json` (gitignored)
5. Form UI writes JSON
6. HTML/CSS template → print CSS → browser save as PDF
7. Vite + React + TypeScript
8. Single profile (section toggle/reorder allowed)
9. Close clone of reference layout (sidebar page + experience pages); not pixel-perfect
10. Local form defaults to **private** JSON, with toggle to edit **public**
11. App chrome: split pane form | live A4 preview
12. Public seed data must be **fictional**

## Out of scope (v1)

See [docs/OUT-OF-SCOPE.md](./docs/OUT-OF-SCOPE.md).

## Suggested implementation order

1. Confirm `.gitignore` includes `data/cv.private.json`, `node_modules`, `dist`
2. Scaffold Vite + React + TypeScript in repo root (or `app/` only if you document why)
3. Add TypeScript types matching [docs/DATA-MODEL.md](./docs/DATA-MODEL.md)
4. Seed `data/cv.public.json` with fictional placeholder content
5. Add `data/cv.private.example.json` (safe template) and copy instructions for private file
6. Build A4 preview components per [docs/DESIGN.md](./docs/DESIGN.md)
7. Build form that load/save public or private JSON (toggle)
8. Add print stylesheet + toolbar **Print / Save PDF** (uses `window.print()`)
9. README: `npm install`, `npm run dev`, how to create private data file

## Cloud agent notes

- You already have a git workspace; **do not** look for `/tmp` handoffs on the user’s machine
- Do **not** commit `data/cv.private.json`
- Do **not** copy real PII from any reference screenshots or external CVs into the repo
- Do not rename the GitHub repo unless the human explicitly asks in the cloud session
- Prefer small, reviewable commits only if the human asks you to commit
- If the repo has no commits yet, docs-first then scaffold is fine

## Definition of done (v1)

- [x] `npm run dev` shows split form + A4 preview
- [x] Editing fields updates the preview
- [x] Public/private dataset toggle works; private file gitignored
- [x] Print CSS yields a usable multi-page PDF via browser print
- [x] Public demo data is fictional
- [x] README documents local setup

## Cursor skills (in this repo)

See [.cursor/skills/README.md](./.cursor/skills/README.md).

| Skill | Role |
|-------|------|
| **cv-studio** | Default for this codebase — schema, preview, print, conventions |
| **cv-creator** | Resume *copy* quality only (not the v1 visual template); see `.cursor/skills/cv-creator/PROJECT.md` |
| **prototype** | Throwaway UI/layout experiments |

Invoke **cv-studio** (and read this file + `docs/`) before scaffolding or changing product behavior.

## Optional follow-ups (not v1)

- Rename GitHub repo to `cvStudio`
- Playwright `npm run export-pdf`
- ATS single-column export
- Deploy to Vercel / GitHub Pages
