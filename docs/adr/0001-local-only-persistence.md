# ADR 0001: Local-only persistence

## Status

Accepted (2026-07-20)

## Context

cvStudio is a portfolio demo and personal tool. Users need to keep CV edits without running a backend.

## Decision

- No user accounts, auth, or cloud database.
- Persist the active document in **localStorage**.
- Support **Import JSON** and **Export JSON** so users can backup and move data between browsers/devices.
- PDF is produced via browser print, not stored server-side.

## Consequences

- Clearing site data loses unsaved/local-only work unless the user exported JSON.
- Each origin has its own storage (`cv.peternurmi.com` ≠ `localhost`).
- Multi-device sync is out of scope until a future ADR revisits Persistence.
