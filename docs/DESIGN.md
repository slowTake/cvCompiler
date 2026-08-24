# Design targets

Visual reference: monospace “developer CV” with soft pink accents (screenshots discussed in product grilling — **do not** copy third-party personal contact details).

## App chrome (not printed)

- Split layout: **form** (editable fields, add/remove/reorder) | **live A4 preview**
- Toolbar: Template, Import/Export JSON, type size, Print / Save PDF
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

- A template = **LayoutSkeleton × Theme**. `studio` above is the first skeleton + theme.
- Target ~10 named themes across 2–3 skeletons. **Canva is inspiration only** — identify
  styles/categories, then design original tokens. No copied layouts, assets, or fonts-by-name.
- **No photos / no binary data.** All templates are text-only (portable, local, ATS-safe).
