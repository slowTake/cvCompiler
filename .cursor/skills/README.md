# Project Cursor skills

Skills in this folder are available to agents working in **this repository** (including cloud agents that clone it).

| Skill | Path | Use when |
|-------|------|----------|
| **cv-studio** | [cv-studio/](./cv-studio/) | Building or changing the cvStudio app, schema, preview, print |
| **cv-creator** | [cv-creator/](./cv-creator/) | Improving CV *copy* / bullet quality (see [PROJECT.md](./cv-creator/PROJECT.md)) |
| **prototype** | [prototype/](./prototype/) | Throwaway layout/logic experiments before committing to the real UI |

## Personal skills (not vendored)

These stay in `~/.cursor/skills/` and are optional for the owner’s local sessions:

- `grill-me` / `grill-with-docs` — sharpen scope before large changes
- `handoff` — session compact (prefer updating `AGENT.md` for cloud continuity)
- `mvp-prompt` — generate a standalone build prompt after research

Do not copy secrets or private CV data into skill files.
