# ADR 0003: Template registry

## Status

Accepted (2026-07-20)

## Context

We want one form and one `CvDocument`, with room to add layouts (e.g. ATS) later without duplicating the editor.

## Decision

- Store `meta.templateId` on the document (default `"studio"`).
- Resolve templates through a **registry**: `{ id, label, description?, Preview }`.
- v1 ships only the **studio** template; the toolbar Template picker lists registry entries so new templates are additive.

## Consequences

- Preview swaps by `templateId`; form schema stays shared.
- Adding ATS (or others) means a new registry entry + Preview component, not a second app.
