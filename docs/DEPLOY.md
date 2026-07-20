# Deploying cvStudio (Cloudflare Pages)

Lightweight static deploy — no workers API, no database.

## Target

| Item | Value |
|------|--------|
| Host | Cloudflare Pages |
| Domain | **`cv.peternurmi.com`** |
| Build command | `npm run build` |
| Output directory | `dist` |
| Node | 18.18+ (see `.nvmrc`) |

## One-time setup

1. Push this repo to GitHub (branch used for production, usually `main`).
2. Cloudflare Dashboard → **Workers & Pages** → **Create** → **Pages** → Connect Git.
3. Select the repo.
4. Build settings:
   - Framework preset: Vite (or None)
   - Build command: `npm run build`
   - Build output directory: `dist`
   - Root directory: `/` (repo root)
5. Save and deploy.
6. **Custom domains** → Add `cv.peternurmi.com` and follow DNS instructions (CNAME to Pages).
7. From [peternurmi.com](https://peternurmi.com), link to `https://cv.peternurmi.com`.

SPA fallback: [`public/_redirects`](../public/_redirects) ships `/* /index.html 200` for Pages.

## What production users get

- Demo seed from `data/cv.public.json` (fictional); localStorage + Import/Export.
- No Public/Private toggle; `cv.private.json` is never bundled (dev-only optional seed).

## Local production check

```bash
npm run build
npm run preview
# Confirm Private toggle is hidden and dist has no real PII:
rg -i 'pnurmi|9709' dist || true
```

## Privacy

Never commit `data/cv.private.json`. Keep real contact details out of `cv.public.json`.
