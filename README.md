# cvStudio

Personal CV studio: edit structured career data in a form, preview an A4 layout live, and export a styled PDF via the browser’s **Print → Save as PDF**.

> **Repo note:** Local folder and GitHub remote may still be named `cvCompiler`. Product name is **cvStudio**; rename the GitHub repo when ready (`gh repo rename cvStudio`).

## Status

**Docs + decisions locked. App not scaffolded yet.**

See [AGENT.md](./AGENT.md) for the build brief (cloud- and local-agent ready).

## Goals (v1)

- Single-user, personal tool that also doubles as a portfolio demo
- Vite + React + TypeScript
- Form UI writes JSON; split view (form | live A4 preview)
- Styled monospace / two-column CV look (not ATS in v1)
- `cv.public.json` (committed, fictional demo) + `cv.private.json` (gitignored)

## Docs

| Doc | Purpose |
|-----|---------|
| [AGENT.md](./AGENT.md) | Agent brief: scope, first tasks, constraints |
| [docs/DECISIONS.md](./docs/DECISIONS.md) | Locked product/tech decisions from grilling |
| [docs/DATA-MODEL.md](./docs/DATA-MODEL.md) | CV JSON schema |
| [docs/DESIGN.md](./docs/DESIGN.md) | Visual / page layout targets |
| [docs/OUT-OF-SCOPE.md](./docs/OUT-OF-SCOPE.md) | Explicit non-goals for v1 |

## Privacy

Never commit real phone numbers, private emails, or other sensitive contact details in `cv.public.json`. Keep those in `cv.private.json` only (gitignored).

## License

TBD
