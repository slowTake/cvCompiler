# ADR 0004: Cloudflare Pages demo

## Status

Accepted (2026-07-20)

## Context

Deploy a public demo next to the portfolio without shipping private contact details or running a VPS for this SPA.

## Decision

- Host on **Cloudflare Pages** (Git-connected build: `npm run build`, output `dist`).
- Custom domain: **`cv.peternurmi.com`**.
- Production builds load **DemoSeed** (`cv.public.json`) + visitor localStorage only (dev may seed from local `cv.private.json` if present).
- No Public/Private dataset toggle.
- Never bundle `data/cv.private.json` into production assets.

## Consequences

- Owner’s real CV stays local (dev + gitignored file / imported JSON).
- Portfolio links out to the subdomain (no path mount under `peternurmi.com/cv` in this ADR).
