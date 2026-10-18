# cvStudio — agent guide

Static, local-first CV editor: edit a `CvDocument` in a form, see a live A4 preview rendered through a **template registry**, and print to PDF from the browser. Vite + React + TypeScript, no backend. Deploys to Cloudflare Pages at `cv.peternurmi.com`. The GitHub repo is still called `cvCompiler`.

## Guardrails

These are deliberate product decisions. Changing one needs the owner's sign-off and a new ADR in [docs/adr/](./docs/adr/).

- **Local-only data.** It lives in localStorage (a cache), a bound file on disk (File System Access API), or JSON you import and export. There are no accounts, server DB, or cloud sync.
- **PDF goes out only, via print CSS** (`window.print()`). There is no PDF import and no headless PDF generation.
- **Templates are text-only.** A template is a `LayoutSkeleton × Theme`. Schema fields are optional and plain text; there are no photos or binary data.
- **Private data stays private.** `data/cv.private.json` is gitignored and only loads in dev (`import.meta.env.DEV` guard in `src/hooks/useCvDocument.ts`). Seeds and production bundles use only the fictional `data/cv.public.json`.

The full list of decisions and non-goals is in [docs/DECISIONS.md](./docs/DECISIONS.md) and [docs/OUT-OF-SCOPE.md](./docs/OUT-OF-SCOPE.md).

## Where things live

- `src/types/cv.ts`: the `CvDocument` schema. Keep it in sync with [docs/DATA-MODEL.md](./docs/DATA-MODEL.md).
- `src/lib/storage.ts`: normalising, parsing and persisting documents. Import goes through `parseCvJson`.
- `src/templates/registry.ts`: the template list. If a new template reuses an existing skeleton, it needs only a registry entry plus a `[data-cv-theme="…"]` token block in `src/index.css`. No component code changes.
- `src/templates/style.ts`: StyleOverrides (`meta.style`, ADR 0007). It defines the allowed values, sanitises them, and maps them to `--cv-*` tokens. A new override means adding a token, a field there, and a control in `src/components/design/DesignPanel.tsx`.
- `src/components/preview/skeletons/`: one component per layout skeleton (`sidebar`, `single`, `header-band`).
- `src/index.css`: app chrome uses the global `:root` tokens, and CV preview rules (`.cv-*`) use only the `--cv-*` tokens. Keep the two sets separate so a theme never restyles the app.
- `src/components/form/CvForm.tsx`: the whole editor form.

## Working here

- **Glossary.** Use the terms in [CONTEXT.md](./CONTEXT.md) (CvDocument, Template, LayoutSkeleton, Theme, BoundFile, DemoSeed) in code, docs and PRs.
- **Done gate.** `npm run build`, `npm run lint` and `npm test` all pass. For any change you can see, check it in the running app (`.claude/launch.json` → "cvStudio dev"). Preview or CSS changes also need a check of Print → Save as PDF output, because print CSS breaks differently from the screen.
- **Privacy check.** After `npm run build`, grep `dist/` for strings from `data/cv.private.json` if that file exists. There should be no matches.
- **Print and design rules.** Read [docs/DESIGN.md](./docs/DESIGN.md) before changing the preview, themes or print styles.
- **Deploying.** Read [docs/DEPLOY.md](./docs/DEPLOY.md) before touching build output, `public/_redirects` or hosting.
- **New decisions.** Record them as an ADR in `docs/adr/` (next number) and add a row to `docs/DECISIONS.md`.
- **History.** Finished build plans move to `docs/archive/`.
- **Node.** Use Node 18.18+ (see `.nvmrc`). Vite stays pinned to 6 for that reason.
