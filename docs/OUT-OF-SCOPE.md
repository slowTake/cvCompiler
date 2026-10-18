# Out of scope

Do not implement these unless the owner expands scope with a new ADR / decision.

- PDF import / OCR / reverse-engineering PDFs into `CvDocument`
- ATS keyword scoring / job-description matching (the single-column `ats` template ships; scoring does not)
- Cover letters, LinkedIn optimization, interview prep
- Multi-user accounts, auth, cloud sync, server database
- Multiple named CV variants / per-job forks
- Playwright (or other) one-click headless PDF download
- Path mount under `peternurmi.com/cv` (use `cv.peternurmi.com`)
- Hetzner VPS CI for this SPA (Cloudflare Pages is the chosen host)
- Pixel-perfect recreation of a third party’s PDF chrome
- Committing real private contact details into `cv.public.json` or production bundles
