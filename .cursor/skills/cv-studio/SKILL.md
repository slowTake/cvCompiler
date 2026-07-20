---
name: cv-studio
description: >-
  Work on the cvStudio personal CV builder (Vite/React/TS): form editing of
  public/private JSON, live A4 preview, browser print-to-PDF, and the monospace
  two-column layout. Use when scaffolding or changing this repo, editing CV
  data/schema, preview/print CSS, or when the user mentions cvStudio, cvCompiler,
  or this project's CV PDF export.
---

# cvStudio

Canonical product docs live at the repo root — **read before coding**:

| Doc | When |
|-----|------|
| [AGENT.md](../../../AGENT.md) | Mission, cloud-agent notes, definition of done |
| [docs/DECISIONS.md](../../../docs/DECISIONS.md) | Locked product/tech choices |
| [docs/DATA-MODEL.md](../../../docs/DATA-MODEL.md) | JSON schema |
| [docs/DESIGN.md](../../../docs/DESIGN.md) | Page layout + print targets |
| [docs/OUT-OF-SCOPE.md](../../../docs/OUT-OF-SCOPE.md) | What not to build in v1 |

## Non-negotiables

1. **Personal tool + static demo** — no auth, no multi-user backend.
2. **Styled PDF via print CSS** — `window.print()` / Save as PDF. No PDF import. No Playwright in v1.
3. **Data split** — `data/cv.public.json` (committed, fictional) vs `data/cv.private.json` (**never commit**; **dev-only** load).
4. **Persistence** — localStorage + Import/Export JSON.
5. **Templates** — `meta.templateId` + registry; form stays shared.
6. **Prod** — public/demo seed only; hide Private toggle; never bundle private JSON.
7. **Split UI** — form | live A4 preview.
8. **No real PII** in public seed or production `dist/`.

## Sibling skills in this repo

| Skill | Use for |
|-------|---------|
| `cv-studio` (this) | App architecture, schema, preview, print, repo conventions |
| `cv-creator` | Bullet quality, metrics language, ATS *content* rules — **not** the visual template for v1 export |
| `prototype` | Throwaway UI/layout experiments before wiring the real form |

When `cv-creator` conflicts with this project's design (two-column, mono, pink accents): **cv-studio wins for the styled export**. Keep ATS single-column as a future template only.

## Implementation checklist

- [x] Types match `docs/DATA-MODEL.md`
- [x] Preview matches `docs/DESIGN.md` structure (sidebar page + experience pages)
- [x] `@media print` hides app chrome
- [x] `.gitignore` includes `data/cv.private.json`
- [x] Public demo data is fictional

## Anti-patterns

- Committing `cv.private.json`
- Building ATS as the only/default layout in v1
- Editing finished PDFs instead of regenerating from JSON
- Pixel-chasing decorative chrome from third-party reference CVs
- Deploy/auth scope creep before print preview works
