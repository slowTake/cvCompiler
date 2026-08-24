# ADR 0006: Durable local persistence (bound file)

## Status

Accepted (2026-08-24) — amends [ADR 0001](./0001-local-only-persistence.md).

## Context

ADR 0001 stores the active document in localStorage with manual Import/Export JSON.
The trap: clearing site data (or switching browsers) silently loses work unless the
user remembered to Export. For a tool the owner wants to *rely on*, that is too fragile —
but adding a backend was ruled out and remains ruled out.

## Decision

- Add a **BoundFile**: the user picks a `.json` on disk once, and **Save** writes the
  `CvDocument` back to that file via the **File System Access API**.
- **localStorage stays** as the fast autosave/cache; the BoundFile is the durable copy.
- **Graceful fallback**: where the File System Access API is unavailable (e.g. Firefox,
  Safari), the app keeps today's behaviour — localStorage + Export JSON — with no regression.
- Still **no accounts, no server, no cloud sync**. This is durability, not hosting.

## Consequences

- The owner's real CV survives site-data clears without manual export discipline.
- Two persistence paths to maintain (bound-file vs export-only) gated on feature detection.
- No multi-device sync; moving devices still means carrying the JSON file. (Unchanged.)
- Reaffirms local-only: the BoundFile lives on the user's machine, never uploaded.
