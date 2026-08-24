# Implementation Spec — Templates, Navigation, Durable Persistence

Status: Ready to build · 2026-08-24
Owns decisions: [ADR 0005](./adr/0005-template-model-and-optional-fields.md),
[ADR 0006](./adr/0006-durable-local-persistence.md), D18–D21 in
[DECISIONS.md](./DECISIONS.md).

## Goal

Grow cvStudio from one hardcoded layout into ~10 named templates, make the editor
easier to navigate, and make local data durable — **without** adding a backend, photos,
or a VPS. Sequenced **refactor-first**: the theming refactor (Phase 1) is a prerequisite
that unlocks every later phase cheaply.

## Non-goals (unchanged)

- No accounts / server / cloud sync (ADR 0001, 0006).
- No photos or binary data in the document (ADR 0005).
- No VPS hosting; Cloudflare Pages stays (D20).
- No cloning of third-party (Canva) templates — inspiration only (D18).

## The core idea

A **Template = LayoutSkeleton × Theme**:

- **LayoutSkeleton** — structure only (2–3 total): `sidebar` (today's studio),
  `single` (single-column / ATS-friendly), `header-band` (full-width name band + body).
- **Theme** — a named set of `--cv-*` design tokens (font, palette, accent, density,
  header treatment) applied over any skeleton.

Users pick from a **gallery of ~10 precomposed named templates**; `meta.templateId`
stays a flat string resolving to `{ skeletonId, themeId }` internally.

---

## Phase 1 — Preview theming refactor (PREREQUISITE, no visual change)

**Why first:** all CV visual identity currently lives in ~260 lines of global `.cv-*`
rules ([index.css](../src/index.css) from `.cv-preview-stack` onward) that reference
the *same* `:root` tokens (`--ink`, `--accent`, `--mono`, …) used by the toolbar and
form. Themes can't vary the CV without also restyling the app chrome until this is split.

**Scope**

1. Define a **preview-scoped token contract** — a fixed set of `--cv-*` custom
   properties, documented in one place (`src/templates/tokens.css` or a `THEME-TOKENS.md`):
   - Type: `--cv-font-body`, `--cv-font-heading`
   - Color: `--cv-ink`, `--cv-muted`, `--cv-paper`, `--cv-panel`, `--cv-line`,
     `--cv-accent`, `--cv-accent-strong`
   - Rhythm: `--cv-density` (spacing multiplier), `--cv-radius`, `--cv-sidebar-width`
   - Header treatment: `--cv-header-transform` (`uppercase`/`none`),
     `--cv-header-accent` (bar / underline / rule)
   - Keep existing `--cv-scale`.
2. Define the **studio theme** as the first concrete token set, scoped to the preview
   root (`.cv-preview-stack[data-cv-theme="studio"]`), with values copied from today's
   look so output is **pixel-identical**.
3. Rewrite the `.cv-*` preview rules to reference **only `--cv-*` tokens** — no global
   `:root` tokens, no hardcoded hex/rgb (59 literal colors exist today; the CV-preview
   ones move to tokens). App-chrome rules (`.toolbar`, `.cv-form`, `.btn`, `.field`…)
   keep using the global `:root` tokens untouched.

**Files:** `src/index.css` (split), new `src/templates/tokens.css` (or `theme/studio.css`),
`src/components/preview/CvPreview.tsx` (add `data-cv-theme` attr on root).

**Acceptance**

- `npm run build` clean; `npm run lint` clean.
- Studio output is visually unchanged on screen **and** in Print → Save as PDF
  (compare against a pre-refactor PDF; this is the regression gate).
- No `.cv-*` rule references a global `:root` token or a raw color literal.

**Tests (introduce Vitest here):**

- `getTemplate` / `resolveTemplateId` resolution (default + unknown id fallback).
- `normalizeCvDocument` round-trips a document unchanged.
- `parseCvJson` accepts the public seed and rejects malformed input.

---

## Phase 2 — Skeleton × theme architecture

**Scope**

1. Add ids and types:
   ```ts
   // src/templates/types.ts
   export type LayoutSkeletonId = 'sidebar' | 'single' | 'header-band'
   export type CvTemplate = {
     id: string            // flat templateId, e.g. 'studio'
     label: string
     description?: string
     skeletonId: LayoutSkeletonId
     themeId: string       // e.g. 'studio'
     thumbnail?: string    // for the gallery (Phase 4)
   }
   ```
2. Turn `CvPreview` into a **dispatcher**: resolve the skeleton component by
   `skeletonId`, set `data-cv-skeleton` + `data-cv-theme` + `--cv-scale` on the root,
   and render. Extract today's markup into `SidebarSkeleton` (behavior-preserving move).
3. Skeleton CSS keyed on `[data-cv-skeleton="…"]`; theme tokens keyed on
   `[data-cv-theme="…"]`. The two are orthogonal.
4. Registry: `studio` becomes `{ id:'studio', skeletonId:'sidebar', themeId:'studio' }`.

**Acceptance:** studio still renders identically via the new dispatch path; adding a
second registry entry that reuses `sidebar` + a new theme requires **zero new component
code** (proves the seam).

**Tests:** registry entries all resolve to a real skeleton component; every `themeId`
has a matching token block.

---

## Phase 3 — Optional text-only schema fields

**Scope**

1. Extend `CvDocument.identity` (all optional):
   ```ts
   tagline?: string
   links?: { id: string; label: string; href: string }[]
   ```
2. `normalizeCvDocument` fills safe defaults; `parseCvJson` stays backward-compatible
   (old documents without these fields still import).
3. Add form controls under the Identity / Contact sections in
   [CvForm.tsx](../src/components/form/CvForm.tsx).
4. Skeletons render `tagline` / `links` **only where the design uses them**; absent
   fields render nothing (no layout holes).

**Acceptance:** a pre-Phase-3 exported JSON imports without error; new fields survive
export → import round-trip. **No photo/binary field is added.**

**Tests:** round-trip a document with and without the new fields.

---

## Phase 4 — Template gallery UI

**Scope**

1. Replace the toolbar `<select>` ([Toolbar.tsx:45](../src/components/Toolbar.tsx))
   with a **thumbnail gallery** (popover or panel) of named templates; keep a plain
   `<select>` fallback for keyboard/no-JS and as the a11y baseline.
2. Selecting a template calls the existing `onTemplateChange(templateId)` → `setTemplateId`
   ([useCvDocument.ts:58](../src/hooks/useCvDocument.ts)); the stored value stays a flat id.
3. Thumbnails: lightweight static previews (small pre-rendered SVG/PNG or a scaled live
   mini-preview — decide during build; static is cheaper to maintain).

**Acceptance:** switching templates in the gallery updates the preview and persists;
`meta.templateId` remains a single string in exported JSON.

---

## Phase 5 — Build the themes (and any new skeletons)

**Scope**

- Author `single` and `header-band` skeletons (structure + `[data-cv-skeleton]` CSS).
- Author ~10 **original** themes as `--cv-*` token blocks, inspiration-only from Canva
  categories (minimal, modern, elegant serif, tech mono, ATS-plain, warm, high-contrast…).
- Register ~10 precomposed named templates spanning the skeletons.

**Acceptance:** each template prints cleanly to A4; ATS-style template is genuinely
single-column and copy-paste clean. Every theme validated in Print → Save as PDF.

---

## Phase 6 — Form jump-nav + persisted open state

**Scope**

1. Add a **sticky jump-nav** (section rail or tab strip) over the existing
   `FormSection` components ([CvForm.tsx:93](../src/components/form/CvForm.tsx)):
   click scrolls to + expands a section and highlights the active one.
2. Persist each section's open/collapsed state to localStorage (today `DEFAULT_OPEN`
   is `useState` and resets every reload — [CvForm.tsx:43](../src/components/form/CvForm.tsx)).
3. Revisit defaults so first load isn't a wall (e.g. Identity open, rest collapsed).

**Acceptance:** reload preserves which sections were open; jump-nav moves focus to the
chosen section; no change to the CV document schema.

---

## Phase 7 — Durable persistence (bound file)

**Scope (ADR 0006)**

1. Feature-detect the **File System Access API**. When available, add **"Open file…"**
   and **"Save"** that read/write a user-chosen `.json` via a retained `FileSystemFileHandle`.
2. localStorage stays the fast autosave/cache (current `saveStoredCv` on every edit);
   the bound file is the durable copy. Show which file is bound + last-saved state.
3. **Fallback:** where the API is absent (Firefox/Safari), keep today's
   Import/Export JSON exactly as-is — no regression.
4. Handle can't persist across reloads in all browsers → on load, if no live handle,
   fall back to localStorage and prompt to re-bind on next save.

**Acceptance:** on Chromium, edit → Save writes the bound file; reopening that file
restores the document. On Firefox/Safari, Import/Export still works unchanged.

**Tests:** persistence layer is abstracted behind an interface so the bound-file vs
export-only paths can be unit-tested with a mocked handle.

---

## Sequencing & risk

| Order | Phase | Unlocks | Risk if skipped/reordered |
|------|-------|---------|---------------------------|
| 1 | Theming refactor | All themes | Template #2 re-forks 900-line CSS — the exact hazard ADR 0005 prevents |
| 2 | Skeleton×theme arch | Additive templates | Templates become bespoke components again |
| 3 | Optional fields | Richer templates | Header/modern templates have nowhere to put tagline/links |
| 4 | Gallery UI | Navigable choice | 10 templates in a `<select>` is unusable |
| 5 | Themes + skeletons | The actual 10 | (depends on 1–4) |
| 6 | Jump-nav | Easier editing | Independent; can slot anytime after 1 |
| 7 | Durable persistence | Reliability | Independent; can slot anytime |

Phases 1→5 are a hard chain. **6 and 7 are independent** and can be built in parallel
or interleaved once Phase 1 lands.

## Definition of done

- ~10 named templates in a gallery, each print-clean to A4.
- Old exported JSON still imports; new optional fields round-trip.
- Form has sticky jump-nav with persisted open state.
- Chromium users can bind to a file and Save durably; other browsers unchanged.
- Vitest suite green in CI; `npm run build` and `npm run lint` clean.
- Studio template visually identical to pre-refactor baseline.
