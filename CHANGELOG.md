# Changelog

## 1.4.1

Docs & marketing assets for latest techniques:

- Regenerated README screenshots (UV–Vis, IR, Raman, **¹H NMR**, **MS**, compare, export, light theme)
- Guide step images + `og-cover.png` under `public/images/`
- Capture script covers NMR/MS tabs (`npm run screenshots`)
- `index.html` / README / Guide copy updated for UV–Vis · NMR · MS · IR · Raman

## 1.4.0

**Mass spectrometry teaching tab** (local library):

- Pilot **15 compounds** under `data/ms-seeds/` (EI; some ESI / HRMS / MALDI-TOF)
- Explorer **MS** tab with method toggle (EI / ESI / HRMS / MALDI-TOF when present)
- Explicit UI note: literature m/z intensities often disagree across papers — teaching schematic only
- Validators, unit tests, e2e; docs `docs/MS_PLAN.md`

## 1.3.0

**¹H / ¹³C NMR teaching upgrade** (local library, package-ready):

- Pilot **15 compounds** with teaching ¹H + ¹³C peak lists under `data/nmr-seeds/`
- Dataset techniques `nmr_1h` / `nmr_13c`; index flags + summary counts
- Explorer tabs **¹H NMR** / **¹³C NMR** with **60 MHz | 500 MHz** multiplet simulation
- Client + build simulators (`src/lib/nmrSimulate.ts`, `tools/nmr-lib.mjs`)
- Validators, unit tests, e2e smoke for NMR field toggle
- Deep links: `?tech=nmr1h` / `?tech=nmr13c`

## 1.2.0

Library expansion + packaging research:

- **+23 UV teaching seeds** (Nile Red, Coumarin 153, fluorene, stilbene, ketones, naphthols, indicators, solvents cutoffs, …) → ~126 full UV envelopes / ~505 compounds
- UV seeds remain the only source of truth under `data/uv-seeds/`
- Docs: [DATA_SOURCES.md](docs/DATA_SOURCES.md) (open databases, what not to scrape, **local-first package** recommendation)
- Docs: [NMR_PLAN.md](docs/NMR_PLAN.md) + `data/nmr-seeds/_template.json` (¹H/¹³C, 60 vs 500 MHz design — not wired in UI yet)
- CONTRIBUTING trimmed (no command-dump contribution path)

## 1.1.2

Maintainability and review follow-ups:

- UV teaching seeds moved entirely to `data/uv-seeds/*.json` (build script no longer embeds the FULL array)
- Dataset `version` stamp aligned with app (**1.1.1**+)
- Lint (`oxlint --deny-warnings`) is part of `npm run ci`
- Safer DOI handling only via `safeDoiUrl` (no unsafe fallback)
- Peak-label collision avoidance; 2D-only structure badge; explorer helpers extracted
- Docs: `docs/PWA.md`, `docs/A11Y_MOBILE_CHECKLIST.md`

## 1.1.1

Security / integrity hardening:

- Allowlist **http(s) only** for spectrum and reference links (`tools/safe-url.mjs`, `src/lib/safeUrl.ts`)
- Dataset build rejects `javascript:` / `data:` / bad DOIs on `source.url` / `source.doi`
- Citations panel only renders safe hrefs
- Plot empty state uses React nodes (no `innerHTML`)
- Schema-example compounds hidden from search browse (still via `/c/schema-example-uv`)
- Share URLs encode compound ids; `tests/safe-url.test.mjs`

## 1.1.0

Instructor page + course docs under `docs/course/`. Same app otherwise.

## 1.0.0

First release I’m comfortable linking people to.

- Explorer / lab / guide / about routes, deep links `/c/:id?tech=`
- Lab set (~35) with note pack export
- Teaching vs experimental quality tags; plot watermark on teaching curves
- Dataset build + schema checks; offline SDF cache for common CIDs
- Playwright smoke in CI; Pages deploy

Still no real open experimental digitizations in the tree. Teaching only until someone contributes rights-cleared series.

## Earlier

A pile of smaller bumps while this was named a few things and the UI settled down. Not worth replaying version-by-version here — see git history if you care.
