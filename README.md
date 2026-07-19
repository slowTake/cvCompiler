# cvStudio

Personal CV studio: edit structured career data in a form, preview an A4 layout live, and export a styled PDF via the browser’s **Print → Save as PDF**.

> **Repo note:** Local folder and GitHub remote may still be named `cvCompiler`. Product name is **cvStudio**; rename the GitHub repo when ready (`gh repo rename cvStudio`).

## Status

**v1 app scaffolded** — form + live A4 preview + print CSS. See [AGENT.md](./AGENT.md) for product constraints.

## Requirements

- **Node.js 18.18+** (Vite 6). Node 18.19 works; Vite 8+ does not (needs Node 20+).

## Quick start

```bash
cp data/cv.private.example.json data/cv.private.json
npm install
npm run dev
```

Open the local Vite URL. The form defaults to the **private** dataset. Use the toolbar toggle to edit **public** demo data.

### Export PDF

1. Click **Print / Save PDF** (or use the browser print dialog).
2. Choose **Save as PDF** / **Print to PDF**.
3. App chrome (toolbar + form) is hidden by print CSS.

### Save JSON

**Save JSON** writes the active dataset to `localStorage` and downloads `cv.private.json` or `cv.public.json`. Replace the file under `data/` if you want the seed on disk to match.

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Local app with live preview |
| `npm run build` | Typecheck + production build |
| `npm run preview` | Preview the production build |
| `npm run lint` | Oxlint |

## Goals (v1)

- Single-user, personal tool that also doubles as a portfolio demo
- Vite + React + TypeScript
- Form UI writes JSON; split view (form \| live A4 preview)
- Styled monospace / two-column CV look (not ATS in v1)
- `cv.public.json` (committed, fictional demo) + `cv.private.json` (gitignored)

## Docs

| Doc | Purpose |
|-----|---------|
| [AGENT.md](./AGENT.md) | Agent brief: scope, first tasks, constraints |
| [docs/DECISIONS.md](./docs/DECISIONS.md) | Locked product/tech decisions |
| [docs/DATA-MODEL.md](./docs/DATA-MODEL.md) | CV JSON schema |
| [docs/DESIGN.md](./docs/DESIGN.md) | Visual / page layout targets |
| [docs/OUT-OF-SCOPE.md](./docs/OUT-OF-SCOPE.md) | Explicit non-goals for v1 |

## Privacy

Never commit real phone numbers, private emails, or other sensitive contact details in `cv.public.json`. Keep those in `cv.private.json` only (gitignored).

## License

TBD
