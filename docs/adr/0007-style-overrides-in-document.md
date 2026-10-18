# ADR 0007: Style overrides live in the document

## Status

Accepted (2026-10-18). Extends [ADR 0005](./0005-template-model-and-optional-fields.md).

## Context

The ten templates are fixed pairings of a LayoutSkeleton and a Theme. Users of CV
builders like Canva, FlowCV and Reactive Resume expect to adjust a template: change the
accent colour, the fonts and the spacing. Today the only adjustable setting is the
**Type size** slider, and it has a problem. It is saved per browser (in localStorage under
`cvstudio-preview-scale`) yet it changes the printed PDF, so the same JSON can print
differently on two machines.

## Decision

- Add an optional **`meta.style`** object (**StyleOverrides**) to `CvDocument`. It holds a
  small, fixed set of overrides applied on top of the active template's Theme:
  - `accent`: a `#rrggbb` hex value. The other accent-related colours (light accent,
    sidebar tint, rules, header band) are derived from it in CSS with `color-mix()`.
  - `fontPairing`: one of `mono`, `sans`, `serif`, `editorial` (serif headings with sans
    body) or `technical` (mono headings with sans body).
  - `density`: `compact`, `normal` or `roomy`. This multiplies spacing only, not type size.
  - `headerCase`: `upper` or `normal`.
  - `sidebarWidth`: a percentage from 30 to 50. Only the `sidebar` skeleton reads it.
  - `typeScale`: a percentage from 80 to 145. This replaces the per-browser Type size
    setting.
- Every field is optional. A missing field means "use the template's value". A missing or
  empty `meta.style` renders exactly as before, so existing JSON files keep working
  unchanged.
- Overrides are passed to the preview as `--cv-*` custom properties and `data-cv-*`
  attributes on the preview root. Preview CSS keeps reading only `--cv-*` tokens
  (ADR 0005), so the token contract stays the single interface between the document and
  the CSS.
- Unknown or out-of-range values are dropped silently when a document is normalised,
  instead of failing the import, in the same lenient way as the other optional fields.
- Overrides persist when you switch templates. **Reset to template** clears them.
- On first load, any old per-browser Type size value is moved into `meta.style.typeScale`
  once, and the localStorage key is then deleted.
- Fonts stay limited to the built-in system font stacks. There are no web fonts or
  bundled font files (DESIGN.md).

## Consequences

- One JSON file fully describes how a CV looks on screen and in print, on any machine.
- The ten templates now act as starting points, and users get many more looks without
  extra components.
- An accent colour can be hard to read on a light page. The Design tab shows a contrast
  warning but does not block the choice.
- Free-form CSS and per-colour palettes are deliberately out of scope. Adding a new
  override means adding a token, a field and a control, which keeps the set small.
