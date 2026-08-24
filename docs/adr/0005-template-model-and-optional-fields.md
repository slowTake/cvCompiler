# ADR 0005: Template model — skeleton × theme, gallery, optional fields

## Status

Accepted (2026-08-24) — refines and partly supersedes [ADR 0003](./0003-template-registry.md).

## Context

We want ~10 templates to make cvStudio feel like a real CV builder, drawing
*inspiration* (not clones) from popular styles seen on Canva. ADR 0003 modelled a
template as a bespoke `Preview` component and froze the form schema. Doing that 10×
would mean 10 components duplicating ~900 lines of global `.cv-*` CSS — an explicit
maintainability hazard. Some desirable styles (tagline header, socials row) also want
fields `CvDocument` does not have.

## Decision

- A **Template = LayoutSkeleton × Theme**.
  - **LayoutSkeleton**: structural arrangement only. Small fixed set (target 2–3),
    e.g. sidebar-left two-column (the current `studio`), single-column/ATS, header-band.
  - **Theme**: named design tokens (font, palette, accent, density, header treatment)
    applied over a skeleton via CSS custom properties. Many themes per skeleton.
- The registry ships **precomposed, named templates** (a **TemplateGallery** thumbnail
  grid in the toolbar). `meta.templateId` stays a single flat string; each id resolves
  internally to `{ skeletonId, themeId }`. No two-axis picker exposed to users in v1.
- **Schema gains optional, text-only fields** as templates need them (e.g.
  `identity.tagline?`, `identity.links?: {label,href}[]`). Every template renders what
  it uses and ignores the rest. This is the part that supersedes ADR 0003's
  "templates never change the schema."
- **No binary/photo fields.** CVs stay text-only so the document remains trivially
  local, portable in one JSON file, and ATS-friendly. (Photo header templates are out.)
- Themes are **original work**. Canva is used only to identify styles/categories —
  no copied layouts, assets, named fonts, or pixel-matching (see DESIGN.md fidelity bar).

## Consequences

- Adding a template is usually a new **theme token set** + a gallery entry, not a new
  component — the maintainable path. New *structure* is a new skeleton (rare, 2–3 total).
- One shared form and one `CvDocument`; new optional fields appear once, used by any template.
- Global `.cv-*` CSS must be refactored so skeleton structure and theme tokens are
  separable (tokens via CSS variables scoped to the preview root).
- Ruling out photos caps visual range but removes the base64/localStorage-size and
  "where does the image live" problems entirely.
