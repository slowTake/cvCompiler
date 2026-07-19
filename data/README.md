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

`cv.public.json` is created when the app is scaffolded (fictional seed). Until then this folder may only contain the example + this README.
