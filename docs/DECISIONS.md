# Decisions

Locked during a grill-me session (2026-07-19). Change only with an explicit product decision.

| ID | Topic | Decision |
|----|--------|----------|
| D01 | Audience | Personal only — owner’s tool + portfolio demo. No multi-user auth. |
| D02 | MVP export | Styled visual PDF only. No ATS template in v1. |
| D03 | Runtime | Local app for real exports; public demo deployable later. |
| D04 | Data privacy | Two files: public (committed) + private (gitignored). |
| D05 | Editing | Form UI is the primary editor; it writes JSON. |
| D06 | PDF pipeline | HTML/CSS → print CSS → browser Print → Save as PDF. |
| D07 | Stack | Vite + React + TypeScript. |
| D08 | Profiles | Single CV profile. Section toggle/reorder OK; no named variants in v1. |
| D09 | Visual fidelity | Close clone of reference structure (not pixel-perfect side bars/chrome). |
| D10 | PDF UX | Browser print for MVP. Playwright automation is optional later. |
| D11 | Default dataset | Locally, form edits private JSON by default; toggle to edit public. |
| D12 | App layout | Split view: form \| live A4 preview; print control in toolbar. |
| D13 | Naming | Product name **cvStudio**. GitHub may still be `cvCompiler` until renamed. |
| D14 | Public seed | Fictional placeholder person only. |
| D15 | Deploy | Deferred. `npm run build` is enough for v1. |

## Rationale (short)

- **Styled-only MVP:** Matches the desired portfolio look; ATS can be a second template later.
- **Public/private split:** Safe to open-source the demo without leaking contact details.
- **Print CSS:** Best fidelity for CSS-heavy layouts without a PDF layout engine in v1.
- **Vite:** Light static-friendly stack for form + preview.
