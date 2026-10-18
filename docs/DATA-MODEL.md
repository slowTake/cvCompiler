# cvStudio data model

A CV is one JSON document, a `CvDocument`. The TypeScript source of truth is
[`src/model/types.ts`](../src/model/types.ts); this page describes the same
schema for people writing or editing files by hand. A complete example ships
in [`data/cv.public.json`](../data/cv.public.json).

All text is plain text. There are no photos, binary data or rich text.

## Top level

| Field        | Type               | Required | Notes                                           |
| ------------ | ------------------ | -------- | ----------------------------------------------- |
| `version`    | `1`                | no       | Schema version. Files with a higher number are rejected. |
| `meta`       | [Meta](#meta)      | no       | Defaults are filled in when missing.            |
| `identity`   | [Identity](#identity) | **yes** | Must contain `name`.                         |
| `skills`     | [SkillGroup](#skillgroup)[] | no | Missing means `[]`.                         |
| `experience` | [Experience](#experience)[] | no |                                             |
| `projects`   | [Project](#project)[]       | no |                                             |
| `education`  | [Education](#education)[]   | no |                                             |
| `languages`  | [Language](#language)[]     | no |                                             |

Every list entry has an `id` string. It keeps list editing stable. Files
without ids, or with ids repeated in one list, still load: missing or
repeated ids are replaced with fresh ones.

## Meta

| Field        | Type                 | Notes                                                           |
| ------------ | -------------------- | --------------------------------------------------------------- |
| `title`      | string               | Document title. Used for file names and the default PDF name. Defaults to the person's name. |
| `templateId` | string               | A template id from the registry (see below). Unknown ids fall back to `studio`. |
| `style`      | [StyleOverrides](#styleoverrides) | Optional. A missing field means "use the template default". |
| `sections`   | SectionConfig[]      | Order and visibility of CV sections.                            |

### SectionConfig

```json
{ "id": "experience", "visible": true, "title": "Work history" }
```

- `id` is one of `about`, `skills`, `experience`, `projects`, `education`,
  `languages`.
- `visible` defaults to `true`. `title` is an optional custom heading.
- A bare string such as `"experience"` is accepted as shorthand.
- List order is CV order. Unknown and duplicate ids are dropped. If a file
  lists only some sections, the missing ones are added at the end, hidden.
- On the **sidebar** skeleton, `about` and `skills` sit in the side column
  (in this order relative to each other); everything else flows in the main
  column.

### StyleOverrides

| Field          | Values                                                     | Notes |
| -------------- | ---------------------------------------------------------- | ----- |
| `accent`       | `#rrggbb`                                                  | `#rgb` and upper case are accepted and normalised. Related tints are derived with `color-mix()`. |
| `fontPairing`  | `mono`, `sans`, `serif`, `editorial`, `technical`          | `editorial` = serif headings + sans body; `technical` = mono headings + sans body. System fonts only. |
| `density`      | `compact`, `normal`, `roomy`                               | Spacing only; type size is unchanged. |
| `headerCase`   | `upper`, `normal`                                          | Section headings. |
| `sidebarWidth` | integer, 30–50                                             | Percent of page width. Sidebar skeleton only, but kept on other templates. |
| `typeScale`    | integer, 80–145                                            | Percent. |

Overrides survive template switches. "Reset to template" in the editor
removes `style` entirely. Invalid values are dropped; out-of-range numbers
are clamped and rounded.

## Identity

| Field     | Type                | Required | Notes |
| --------- | ------------------- | -------- | ----- |
| `name`    | string              | **yes**  | May be empty while editing. |
| `role`    | string              | no       | Headline under the name. |
| `about`   | string              | no       | Shown in the About section. Blank lines separate paragraphs. |
| `contact` | ContactItem[]       | no       | |
| `links`   | LinkItem[]          | no       | Extra labelled links shown with the contact details. |

**ContactItem**: `{ id, kind, value, href? }`

- `kind`: `email`, `phone`, `location`, `website`, `linkedin`, `github` or
  `other`. Unknown kinds become `other`. The kind picks the icon and how the
  link is built (`mailto:`, `tel:`, or `https://` for bare domains).
- `value` (required): the text shown.
- `href` (optional): an explicit link target.

**LinkItem**: `{ id, url, label? }`. `url` is required; `label` defaults to the URL.

Only `http:`, `https:`, `mailto:` and `tel:` links are rendered as links.
Anything else, such as `javascript:`, is shown as plain text.

## SkillGroup

`{ id, name, items }`. `name` is required (may be empty); `items` is a list of strings.

## Experience

| Field      | Type     | Required |
| ---------- | -------- | -------- |
| `title`    | string   | **yes**  |
| `org`      | string   | **yes**  |
| `start`    | string   | no       |
| `end`      | string   | no       |
| `location` | string   | no       |
| `bullets`  | string[] | no (defaults to `[]`) |
| `skills`   | string[] | no ("Skills developed") |

Dates are free text (`"2021"`, `"Mar 2022"`, `"Present"`), so use whatever
format you like. Numbers such as `2021` are accepted and turned into text.

## Project

`{ id, name, role?, start?, end?, url?, summary?, bullets?, tech? }`. `name` is required.

## Education

`{ id, institution, degree?, start?, end?, location?, details? }`. `institution` is required.
When `degree` is set it is the entry's title and the institution is shown under it.

## Language

`{ id, name, level? }`. `name` is required. `level` is free text (`"Native"`, `"C1"`).

## Import rules

Import (and Open…) validates the whole file and lists every problem with its
JSON path, for example `experience[2].title is required`. A file is
**rejected** only for broken structure:

- the file is not valid JSON, or the root is not an object;
- `identity` is missing or not an object;
- a list section (`experience`, …) is present but not a list;
- a list entry is not an object, or a required field is missing or not text;
- `version` is newer than this app supports.

Everything else is **lenient**: invalid optional values (a number where a
list is expected, an unknown template, a bad colour, an unknown style key)
are quietly dropped, and the rest of the file loads.

## Templates

`meta.templateId` refers to an entry in
[`src/templates/registry.ts`](../src/templates/registry.ts):

| Skeleton      | Templates |
| ------------- | --------- |
| `sidebar`     | `studio` (default), `slate`, `nocturne`, `fern` |
| `single`      | `classic`, `minimal`, `ledger` |
| `header-band` | `harbor`, `sunrise`, `graphite` |
