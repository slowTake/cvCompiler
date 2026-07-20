# ADR 0002: No PDF import

## Status

Accepted (2026-07-20)

## Context

Importing arbitrary PDFs into a structured `CvDocument` requires brittle layout parsing/OCR and fights a lightweight static app.

## Decision

- **PDF is output only** (browser Print → Save as PDF).
- Structured editing uses **JSON import/export** only.
- Do not add PDF→CV parsers in v1.

## Consequences

- Users migrate existing CVs by editing the form or hand-authoring JSON.
- Template switching restyles the same `CvDocument`; it does not reverse-engineer a PDF.
