# cvStudio

A static, local-first CV editor. Edit a structured CV in a form next to a live
A4 preview, then export a styled PDF with the browser's **Print → Save as PDF**.
There is no backend, no account and no tracking: your CV stays on your machine.

## Setup

Requires Node 18.18 or newer.

```bash
npm install
npm run dev        # http://localhost:5173
```

| Script            | What it does                                  |
| ----------------- | --------------------------------------------- |
| `npm run dev`     | Dev server with hot reload                    |
| `npm run build`   | Type-check and build the static site to `dist/` |
| `npm run preview` | Serve the production build locally            |
| `npm run lint`    | oxlint (warnings fail the run)                |
| `npm test`        | Vitest unit tests                             |

## Saving your CV

The document is one JSON file ([schema](docs/DATA-MODEL.md)). There are three
places it can live:

1. **A file on disk (Chromium browsers: Chrome, Edge, Brave, Arc).**
   **Open…** binds a `.json` file through the File System Access API; **Save**
   (⌘S / Ctrl+S) writes straight back to it, and **Save as…** (⇧⌘S /
   Ctrl+Shift+S) picks a new file. The first save after opening asks for
   write permission, because files opened for reading are read-only until you
   allow it. The top bar shows the bound file name and a **● Unsaved** marker
   while you have changes that aren't on disk.
2. **Import / Export JSON (every browser).** Export downloads the document;
   Import loads one. In Firefox and Safari, ⌘S / Ctrl+S exports. Import checks
   the file and lists clear errors for broken structure (with the JSON path
   of each problem). Invalid optional values are dropped quietly.
3. **Browser storage (automatic).** Every change is cached in `localStorage`
   so a reload or crash doesn't lose work. This is a cache, not a backup:
   clearing site data removes it. Keep the real copy in a file.

**Demo** replaces the document with the fictional sample CV.

### Private data during development

`data/cv.public.json` is the shipped demo and contains only fictional data.
To work on your own CV in dev, put it in `data/cv.private.json`. That file:

- is gitignored;
- loads only in `npm run dev` (behind an `import.meta.env.DEV` guard) when
  there is no cached document yet, or via the **Private** button;
- never reaches the production bundle. The DEV branch is removed from builds,
  and as a second line of defence `vite.config.ts` swaps the file for `null`
  in any production build.

## Exporting a PDF

Click **Print / PDF** (or press ⌘P / Ctrl+P). In the print dialog choose:

- **Destination:** Save as PDF
- **Paper size:** A4
- **Margins: None.** The CV already has its own page margins.
- **Background graphics: on** (Chrome: *More settings → Background graphics*;
  Safari: *Print backgrounds*; Firefox: *Print backgrounds*). Without it,
  sidebars, header bands and accent bars come out white.
- Headers and footers: off.

Only the CV is printed. Entries never split across pages, section headings
stay with their first entry, page and sidebar backgrounds repeat on every
page, and column padding repeats at the top of each new page. The on-screen
preview simulates the same page breaks, so the page count and break points
you see should closely match the PDF. The PDF's default file name comes from
the document title (*Document & sections → Document title*).

## Templates

A template is a **layout skeleton × theme**. There are three skeletons:

- **Sidebar**: name, contact, about and skills in a side column (30–50% wide),
  everything else in the main column.
- **Single column**: top to bottom. The most ATS-friendly.
- **Header band**: a coloured band with name and contact over a
  single-column body.

Ten templates ship: Studio (default), Slate, Nocturne, Fern, Classic,
Minimal, Ledger, Harbor, Sunrise and Graphite. Pick one from the thumbnail
gallery under **Design → Templates…**.

**Design** also lets you override the accent colour, font pairing, density,
header case, sidebar width and type scale. Overrides are stored in the
document (`meta.style`), survive template switches, and **Reset to template**
clears them. Setting a control back to the current template's own value
removes that override. You get a warning if the accent has less than 3:1 contrast
against the page, but you can still use it.

### Adding a template

On an existing skeleton you need no component code:

1. Add an entry to `TEMPLATES` in `src/templates/registry.ts`: id, name,
   description, skeleton and defaults for every style knob.
2. Add `src/templates/themes/<id>.css` with a single token block:
   ```css
   .cv-theme-<id> {
     --cv-ink: #1b2430;
     --cv-heading-rule: 2px solid var(--cv-accent-soft);
     /* … */
   }
   ```
   Theme files are loaded automatically. The full token list, with
   defaults, is at the top of `src/styles/cv.css`.

The CV preview reads only `--cv-*` custom properties, and the editor's own
UI uses a separate `--ui-*` set, so a theme can't restyle the editor. Tests
enforce this: theme files may only declare `--cv-*` properties.

## Project layout

```
data/                 demo CV (+ your gitignored cv.private.json)
docs/DATA-MODEL.md    the JSON schema
src/model/            types, parsing/normalising, style overrides, colour maths
src/templates/        registry, skeleton metadata, theme token blocks
src/preview/          CV renderer, skeleton components, pagination, print root
src/editor/           form: one component per section, plus shared fields
src/persistence/      localStorage cache, File System Access, import/export
src/styles/           cv.css (CV structure), ui.css (editor), print.css
tests/                Vitest suites
public/_redirects     SPA fallback for Cloudflare Pages
```

## Deploying to Cloudflare Pages

Connect the repository, then set **Build command** `npm run build` and
**Build output directory** `dist`. Pin Node with `NODE_VERSION=20` (any
version from 18.18 works). `public/_redirects` sends every path to
`index.html`. Everything else is static files, so any static host works too.
