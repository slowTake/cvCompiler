# Design targets

Visual reference: monospace “developer CV” with soft pink accents (screenshots discussed in product grilling — **do not** copy third-party personal contact details).

## App chrome (not printed)

- Split layout: editor pane with **Content | Design** tabs | **live A4 preview**
- Toolbar (one row): logo + document status · template button (opens the gallery) · **File** menu (Open / Save / Import / Export JSON) · Help popover (privacy, saving, print tips) · **Print / Save PDF** as the single primary action
- **Template gallery**: modal grid rendering the user's own CV live in every template (page one, scaled), filterable by skeleton
- **Design tab** (ADR 0007): accent colour (template default, presets, custom + contrast warning), font pairing, spacing density, heading case, sidebar width (sidebar skeleton only), type size, Reset to template
- Screen UI can be simple; the CV preview carries the brand look

## CV pages (printed)

### Page 1 — Sidebar + main

- **Left (~40%):** name, role, contact list with simple line icons, about, skills (grouped) — wide enough that about text isn’t a skinny strip
- **Right (~60%):** education, projects
- Section headers: small icon + ALL CAPS label + light pink bar / underline
- External-link affordance on orgs/projects when `href` is set
- Typography: monospaced throughout the CV document

### Following pages — Experience & languages

- Centered section headers between horizontal rules (e.g. PROFESSIONAL EXPERIENCE, LANGUAGES)
- Experience entries: title/org left; dates (and location) right-aligned
- “Skills developed:” underlined label + comma-separated list
- Languages: simple two-column grid (name + level)

## Print

- A4 page size, sensible margins
- `@media print` hides app chrome (form, toolbar)
- Preview on screen should approximate print pagination (CSS `page` / A4 boxes OK for v1)

## Fidelity bar

**In scope:** structure, mono type, pink accents, icons, link markers, right-aligned dates.  
**Out of scope for v1:** pixel-perfect decorative side bars, exact icon set matching any third-party PDF.

## Templates & themes (ADR 0005)

- A template = **LayoutSkeleton × Theme**. **Canva is inspiration only** — identify
  styles/categories, then design original tokens. No copied layouts, assets, or fonts-by-name.
- **No photos / no binary data.** All templates are text-only (portable, local, ATS-safe).
- Font families vary by theme via safe system stacks (`--cv-stack-mono|sans|serif`) —
  no bundled font files, no external hosting.

### Realized lineup (10 templates, 3 skeletons)

| Skeleton | Templates |
|----------|-----------|
| `sidebar` | Studio (mono/pink), Slate (mono/grey), Noir (mono/b&w), Forest (serif/green), Rose (sans/rose) |
| `single` (ATS) | ATS (sans/plain), Classic (serif), Azure (sans/blue) |
| `header-band` | Modern (sans/teal band), Bold (sans/dark band) |

Source of truth: `src/templates/registry.ts` + `[data-cv-theme]` blocks in `src/index.css`.

### Style overrides (ADR 0007)

`meta.style` layers over any theme through the same token contract:
`--cv-custom-accent` + `[data-cv-accent='custom']` (derived tints via `color-mix()`),
`--cv-font-body` / `--cv-font-heading`, `--cv-density` (spacing only, combined with type
size into `--cv-space`), `--cv-header-transform`, `--cv-sidebar-width` and `--cv-scale`.
With no overrides every template prints pixel-identical to its theme. **Bold** keeps its
dark band under a custom accent; the accent recolours its details.
