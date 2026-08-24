# cvStudio

Edit structured career data in a form, preview an A4 layout live, and export a styled PDF via the browser’s **Print → Save as PDF**. Persist with **localStorage** and **Import / Export JSON** — no accounts or database.

> Product name **cvStudio**. GitHub remote may still be `cvCompiler`.

**Live demo (planned):** [https://cv.peternurmi.com](https://cv.peternurmi.com) — see [docs/DEPLOY.md](./docs/DEPLOY.md).

## Status

Deploy-ready static SPA: template registry (`studio`), JSON import/export, production demo mode (public seed only).

## Requirements

- **Node.js 18.18+** (Vite 6). See `.nvmrc`.

## Quick start (local)

```bash
cp data/cv.private.example.json data/cv.private.json   # optional, local only
npm install
npm run dev
```

In **dev**, if `data/cv.private.json` exists it is used as the initial seed (not shipped in production). Otherwise the public demo seed loads. Use **Import JSON** for any CV file.

### Saving your CV

Edits auto-save to this browser’s localStorage (a cache). For a durable copy:

- **Chromium (Chrome/Edge):** **Open…** binds a `.json` on disk and loads it; **Save** (or ⌘/Ctrl+S) writes the current CV back to that file. The toolbar shows the bound filename and a `•` when there are unsaved changes.
- **Firefox / Safari (no File System Access API):** use **Import JSON** / **Export JSON** — Export downloads a backup, Import loads one.
- **Export JSON** is always available as a plain download.

Clearing site data drops the localStorage cache, but a saved/exported file survives. The bound file is not remembered across reloads — re-open it (localStorage keeps your latest edits in the meantime).

### Export PDF

1. **Print / Save PDF** (or browser print).
2. Destination: Save as PDF.
3. Margins: **None**; enable **Background graphics**.

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Local app with live preview |
| `npm run build` | Typecheck + production build |
| `npm run preview` | Preview the production build |
| `npm run lint` | Oxlint |

## Docs

| Doc | Purpose |
|-----|---------|
| [AGENT.md](./AGENT.md) | Agent brief |
| [CONTEXT.md](./CONTEXT.md) | Domain glossary |
| [docs/DECISIONS.md](./docs/DECISIONS.md) | Locked decisions |
| [docs/SPEC-templates-nav-persistence.md](./docs/SPEC-templates-nav-persistence.md) | Build plan: templates, nav, durable persistence |
| [docs/adr/](./docs/adr/) | Architecture decision records |
| [docs/DATA-MODEL.md](./docs/DATA-MODEL.md) | CV JSON schema |
| [docs/DESIGN.md](./docs/DESIGN.md) | Visual / print targets |
| [docs/DEPLOY.md](./docs/DEPLOY.md) | Cloudflare Pages + `cv.peternurmi.com` |
| [docs/OUT-OF-SCOPE.md](./docs/OUT-OF-SCOPE.md) | Non-goals |

## Privacy

Never commit real phone numbers or private emails in `cv.public.json`. Keep those in `cv.private.json` (gitignored, **not** shipped in production builds).

## License

TBD
