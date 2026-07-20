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
cp data/cv.private.example.json data/cv.private.json
npm install
npm run dev
```

- **Dev:** form defaults to **private** dataset; toolbar can switch to **public**.
- **Production build:** private toggle hidden; only demo/public seed + browser storage.

### Import / Export JSON

- **Import JSON** — load a `CvDocument` backup into the editor (saved to this browser).
- **Export JSON** — download the current document.
- **Save** — write localStorage and download.

Data stays in the browser until you export. Clearing site data drops localStorage.

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
| [docs/adr/](./docs/adr/) | Architecture decision records |
| [docs/DATA-MODEL.md](./docs/DATA-MODEL.md) | CV JSON schema |
| [docs/DESIGN.md](./docs/DESIGN.md) | Visual / print targets |
| [docs/DEPLOY.md](./docs/DEPLOY.md) | Cloudflare Pages + `cv.peternurmi.com` |
| [docs/OUT-OF-SCOPE.md](./docs/OUT-OF-SCOPE.md) | Non-goals |

## Privacy

Never commit real phone numbers or private emails in `cv.public.json`. Keep those in `cv.private.json` (gitignored, **not** shipped in production builds).

## License

TBD
