# cvCompiler

A static, local-first CV editor. Edit a structured CV in a form next to a live
A4 preview, then export a styled PDF with the browser's **Print → Save as PDF**.
There is no backend, no account and no tracking: your CV stays on your machine.

![The editor: form on the left, live A4 preview on the right](docs/images/editor.webp)

- Live A4 preview with the same page breaks as the PDF
- Twenty-three templates, with adjustable colour, fonts and spacing
- Several versions of one CV, each with its own design and selection of entries
- Your CV is a plain JSON file ([schema](docs/DATA-MODEL.md))

## Quick start

You need [Node.js](https://nodejs.org) 18.18 or newer and a modern browser.
Chrome, Edge, Brave and Arc work best because they can save straight to a file;
Firefox and Safari work too.

```bash
git clone https://github.com/slowTake/cvCompiler.git
cd cvCompiler
npm install
npm run dev
```

Open <http://localhost:5173>. The app starts with a fictional demo CV, so you
can try everything before you enter anything of your own.

cvCompiler has no hosted version. To run a production build instead, use
`npm run build` and then `npm run preview`. The output in `dist/` is plain
static files, so any static host can serve it.

## User guide

### Edit your CV

The form is on the left and the live preview on the right. Use the chips above
the form to jump to a section, or click text in the preview to jump to its
field.

- **Entries** (jobs, projects, skill groups and so on) can be added, reordered
  with the arrows and removed. A removal can be undone from the notification.
- **Bold:** wrap words in `**double asterisks**`, or select them and press
  Ctrl/⌘+B. This works in About, descriptions and education details.
- **Contact** details are a list: pick a kind (email, phone, website, …) and
  enter a value.
- **Document & sections** sets the document title and lets you rename, reorder,
  hide and space out sections. In sidebar templates you can also move a section
  between the columns.

### Pick a design

Open **Design → Templates…** to choose from the thumbnail gallery. Your content
is kept when you switch.

![Template gallery](docs/images/templates.webp)

| Layout        | Description                               | Templates |
| ------------- | ----------------------------------------- | --------- |
| Sidebar       | Side column on the left                   | Studio (default), Slate, Nocturne, Fern, Terracotta, Cocoa, Ember, Volt |
| Right sidebar | Side column on the right                  | Charcoal, Paper |
| Single column | Top to bottom; the most ATS-friendly      | Classic, Minimal, Ledger, Academic, Swiss, Centred |
| Header band   | Coloured band over a single column        | Harbor, Sunrise, Graphite, Blueprint, Console |
| Timeline      | A vertical rail with a dot for each entry | Timeline |
| Split         | Section labels left, content right        | Journal |

Under **Design** you can also override the accent colour, fonts, density,
header case, sidebar width and type scale. Overrides stay when you switch
templates, and **Reset to template** clears them all. You get a warning if the
accent colour is hard to read against the page.

### Keep several versions

Use the tabs above the preview to tailor one CV for different applications.

- **+** adds a copy of the version you are viewing. Double-click a tab to
  rename it. The **Original** tab can't be renamed or deleted.
- The content is **shared**: editing a job's text changes it in every version.
- Each version has its own template, style overrides, document title and
  section settings.
- The **Include in** chips on every entry choose which versions show it.
- The preview and **Print / PDF** use the selected version. All versions are
  saved in the same JSON file.

### Save your work

Changes are cached in your browser automatically, so a reload loses nothing.
That is not a backup: clearing site data removes it. Keep the real copy in a
file.

- **Chrome, Edge, Brave, Arc:** **Open…** links a `.json` file and **Save**
  (Ctrl/⌘+S) writes straight back to it. **Save as…** (Ctrl+Shift+S or ⇧⌘S)
  picks a new file. The browser may ask for write permission on the first save.
- **Firefox and Safari:** drop a `.json` file onto the app, or press
  Ctrl/⌘+O, to load it. In a production build, Ctrl/⌘+S downloads the JSON.
- **Under `npm run dev` (any browser):** **Save to repo** writes to the
  git-ignored `saves/` folder of your checkout, and **Open from repo** lists
  what is there. In Firefox and Safari, Ctrl/⌘+S saves there too.

The top bar shows the file name and whether you have unsaved changes. Loading
a broken file changes nothing and lists each problem with its JSON path.

### Export a PDF

Click **Print / PDF** (or press Ctrl/⌘+P) and set these in the print dialog:

| Setting             | Value       |
| ------------------- | ----------- |
| Destination         | Save as PDF |
| Paper size          | A4          |
| Margins             | None        |
| Background graphics | **On** (called *Print backgrounds* in Firefox and Safari) |
| Headers and footers | Off         |

Without background graphics, sidebars, header bands and accent bars come out
white.

![Exported PDF](docs/images/pdf-export.webp)

Entries never split across pages, and section headings stay with their first
entry. The default PDF file name is the document title. The PDF holds only what
you see; no copy of your CV data is hidden inside it.

PDFs can't be imported, so keep the JSON file if you want to edit later.

## Development

| Script               | What it does                                    |
| -------------------- | ----------------------------------------------- |
| `npm run dev`        | Dev server with hot reload                      |
| `npm run build`      | Type-check and build the static site to `dist/` |
| `npm run preview`    | Serve the production build locally              |
| `npm run lint`       | oxlint (warnings fail the run)                  |
| `npm run typecheck`  | Type-check only                                 |
| `npm test`           | Vitest unit tests                               |
| `npm run test:watch` | Vitest in watch mode                            |

CI runs lint, tests and the build on every pull request.

### Project layout

```
data/                 demo CV
docs/DATA-MODEL.md    the JSON schema
docs/images/          README screenshots
server/               dev-server plugin behind the saves/ folder
src/model/            types, parsing, versions, style overrides, colour maths
src/templates/        registry, layout skeletons, theme token blocks
src/preview/          CV renderer, version tabs, pagination, print root
src/editor/           form: one component per section, plus shared fields
src/persistence/      browser cache, File System Access, repo saves
src/styles/           cv.css (CV structure), ui.css (editor), print.css
tests/                Vitest suites
```

The CV page sets `font-variant-ligatures: none`. Keep it: Firefox writes
ligature glyphs ("fi", "ffl") into PDFs without text behind them, which turns
"offline" into "oine" for any ATS reading the file.

### Adding a template

A template is a **layout skeleton × theme**. On an existing skeleton you need no
component code:

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

## License

[MIT](LICENSE)
