# CV data files

| File | Tracked? | Role |
|------|----------|------|
| `cv.public.json` | Yes | Fictional demo data for the portfolio build |
| `cv.private.json` | **No** (gitignored) | Your real CV for local export |
| `cv.private.example.json` | Yes | Copy this to `cv.private.json` and fill in |

```bash
cp data/cv.private.example.json data/cv.private.json
```

Schema: [docs/DATA-MODEL.md](../docs/DATA-MODEL.md).

Edits in the app auto-save to browser `localStorage`. Use **Export JSON** to download a file you can copy over `data/cv.private.json` or `data/cv.public.json`.
