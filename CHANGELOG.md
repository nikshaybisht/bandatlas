# Changelog

## [0.11.0] — 2026-07-16

### Dataset backend (schema + validation)
- **`tools/validate-dataset.mjs`** — compound / index / summary schema; `npm run dataset` fails on invalid records
- **`npm run validate:dataset`** CLI
- Compound records gain build-time **`flags`** (`hasFullUvVis`, `hasIr`, `hasRaman`), **`class_labels` / `classLabels`**, quality enum enforced (`teaching` | `experimental`)
- Index exposes camelCase flag aliases (`hasFullUvVis`, `hasIr`, `hasRaman`, `labSet`) alongside snake_case
- **`summary.json`**: `version`, `total`, `full_uvvis`, `ir`, `raman`, `lab_set`, `catalog_only`, **`generatedAt`** (+ aliases)
- UI reads technique availability via **`compoundFlags` / `indexHasFullUvVis`** (build output only; no tier guessing)
- Tests: `tests/schema.test.mjs` — schema unit tests, counts match summary, every labSet has full UV
- **Full UV teaching curves: 103** (unchanged; already ≥80 credibility bar). Lab set: 35, all full UV.

### Docs
- [docs/ADD_SPECTRUM.md](docs/ADD_SPECTRUM.md) — 15-min seed path + schema validation note

## [0.10.0] — 2026-07-16

### Added
- **60s portfolio tour** (`Run 60s tour`): scripted search → UV → IR → export → UV filter highlights
- **Guide page** redesign: 4 steps with screenshots, tech stack paragraph, honesty line
- **Featured strip** on home (6 full-UV compounds, one click)
- **About skills panel**: Built by Nikshay Bisht + live metrics from `summary.json`
- **Open Graph / Twitter** cards in `index.html` (`public/images/og-cover.png`)
- Spoken script: [docs/DEMO_SCRIPT.md](docs/DEMO_SCRIPT.md)
- README “Portfolio / interview demo” subsection

## [0.9.0] — 2026-07-16

### Added
- **Lab companion** product mode (`/lab`): curated **lab set** (35 compounds, all full UV)
- Index fields: `lab_set`, `lab_classes`, `tags`; `summary.lab_set_count`
- Lab class chips: UV dyes · Solvents · Aromatics · Porphyrins · Biomolecules
- **Discussion card** + one-click **Export Lab Note Pack** (CSV + JSON + Markdown + PNG)
- Shareable technique deep links: `/c/<id>?tech=uvvis|ir|raman` + Copy link
- Clear empty-curve CTA (no blank chart pretending data exists)
- Tests: lab-set UV integrity; markdown note contract; e2e lab + `?tech=`

### Changed
- Lab default filters to lab set (not merely “Has full UV–Vis”)
- Empty UV messaging emphasizes IR/Raman may still be available

## [0.8.0] — 2026-07-16

### Added
- **App shell** with React Router: `/` explorer, `/c/:id` deep links, `/lab`, `/guide`, `/about`
- **App chrome:** top nav, theme toggle, version from `package.json`, teaching-quality banner on explorer
- **First-run welcome** (dismissible, `localStorage`) + configurable default/lab compounds via `index.app_meta`
- Query deep link `?q=benzene` (exact name/id → `/c/:id`)
- **PWA-lite:** `manifest.webmanifest` + theme-color (no service worker — see [docs/PWA.md](docs/PWA.md))
- GitHub Pages SPA fallback: `dist/404.html` copy of `index.html` (`tools/spa-fallback.mjs`)
- E2E coverage for routes and compound deep links

### Changed
- Search/filters live under the chrome on explorer/lab (not mixed into brand bar)
- Footer: MIT + citation one-liner + methodology / GitHub / live links
- Dataset index version **0.8.0** with `app_meta.default_compound_id` (`rhodamine-b`) and lab preset (`benzene`)

## [0.7.2] — 2026-07-16

### Changed
- **Mobile (375px):** stacked topbar, full-width search, wrap filters/tabs, larger touch targets
- **Touch plots:** drag-box zoom disabled on coarse pointer; zoom toolbar + hint
- **Keyboard:** `:focus-visible` rings; Escape closes search + export/citations folds
- **Light theme:** stronger muted/footer/chip contrast (rough WCAG AA for UI text)
- **prefers-reduced-motion:** kill transitions/animations globally

### Added
- [docs/A11Y_MOBILE_CHECKLIST.md](docs/A11Y_MOBILE_CHECKLIST.md) manual QA list

## [Unreleased]

### Added
- **Contributor path for UV teaching seeds:** [docs/ADD_SPECTRUM.md](docs/ADD_SPECTRUM.md)
- `data/uv-seeds/` additive JSON seeds + `_template.json`
- `npm run validate:seeds` (`tools/validate-seeds.mjs`); `npm run dataset` fails on bad seeds
- GitHub issue template: Request / add UV teaching curve
- Tests: `tests/seeds.test.mjs`

## [0.7.1] — 2026-07-16

### Changed
- Renamed overselling **Research** mode → **Absolute scale** (Y-axis only; not a research archive)
- Former **Teaching** scale toggle → **Normalized**
- Always-on plot disclaimer (teaching envelope / experimental / schema example)
- Stronger empty UV copy for catalog-only compounds (IR/Raman still available)
- Overlay disclaimer: qualitative only; solvents/normalizations may differ
- Property card: quality tag + source note/citation for the **active** spectrum
- Light-theme plot axis/peak label contrast improved

### Added (from unreleased)
- Local SDF structure cache; Playwright e2e smoke; CI e2e job

## [Unreleased]

## [0.7.0] — 2026-07-16

### Added
- Per-spectrum **`quality`**: `teaching` | `experimental` (plus optional `example_not_for_citation`, `temperature_K`)
- UI badges: **Experimental** / **Teaching envelope** / **Schema example**
- Filter: **Experimental only** (excludes schema demos)
- Ingest path: `data/experimental/*.json` merged by `npm run dataset`
- Schema demo compound `schema-example-uv` (synthetic, **not for citation**)
- Tests: `tests/experimental.test.mjs` + fixture validating experimental schema
- Methodology: how to add open experimental series; what is forbidden

### Changed
- Version **0.7.0**; teaching envelopes remain `quality: teaching` (never relabeled)
- CSV export includes quality, temperature, DOI
- Index/summary counts: `experimental`, `experimental_examples`

## [0.6.1] — 2026-07-16

### Added
- Expanded full UV–Vis **teaching** set **51 → 102** multi-Gaussian envelopes
- Undergrad-focused seeds: nucleobases (G/C/U), food dyes, stains, cyanines, BODIPY/DAPI/Hoechst, porphyrinoids, cofactors (NADH/FAD), simple heterocycles, PAHs (chrysene, pentacene, coronene, C60)
- Optional `abs.lit` / DOI / URL on FULL seeds → richer `source.citation` in compound JSON

### Changed
- README dataset table and version citation → **0.6.1**
- Dataset index `version` field → 0.6.1

### Notes
- All new curves remain **Tier A teaching envelopes** constrained to tabulated literature λ_max — not experimental digitizations.

## [0.6.0] — 2026-07-16

### Added
- **Live demo** on GitHub Pages: https://nikshaybisht.github.io/bandatlas/
- **Has full UV–Vis** search filter + UV / catalog badges in results
- Expanded full UV–Vis teaching set (**25 → 51** multi-Gaussian envelopes)
- Minimal `npm test` suite (dataset integrity + export CSV contract)
- CI workflow (dataset + test + build) on push/PR to `main`
- Dataset `summary.json` counts from `npm run dataset`
- Clearer teaching-quality notes in property card, plot, and footer

### Fixed
- GitHub Pages deploy (Pages source = GitHub Actions; `has_pages` enabled)
- Vite `base` for project pages (`VITE_BASE` / `GITHUB_ACTIONS`) so assets load under `/bandatlas/`
- Dataset fetches use `import.meta.env.BASE_URL` (no broken paths on Pages)
- Version alignment: package, CITATION.cff, README citation, UI footer → **0.6.0**

### Changed
- README: Live demo table at top; accurate dataset counts

## [0.5.1] — 2026-07-16

### Fixed
- Dark / light theme: CSS tokens for panels, chips, plot, 3D, folds; plot remounts on theme change
- Peak label colours respect light theme
- Spectrum plot: IG-style continuous rainbow under x-axis; smoother emission

### Added
- `docs/HANDOFF.md` and Documents/github handoff for BandAtlas

## [0.5.0] — 2026-07-16

### Changed
- Product and repository renamed to **BandAtlas**
- Final branding (UI, docs, package, GitHub `nikshaybisht/bandatlas`)
- Distinct from mass-spec tools named Chromascope

## [0.4.1] — 2026-07-16

### Changed
- Author attribution for **Nikshay Bisht** (@nikshaybisht)
- Added [SECURITY.md](SECURITY.md)

## [0.4.0] — 2026-07-16

### Added
- Research exports: spectrum CSV, JSON bundle, BibTeX stub
- References / provenance panel with core literature DOIs
- Methods banner and `docs/methodology.md`
- `CITATION.cff`, `CONTRIBUTING.md`
- Error boundary around the main UI
- Screenshots under `docs/images/`

### Changed
- UI wording toward laboratory / teaching use (Teaching vs Research modes)
- README rewritten for scientific readers

## [0.3.0] — 2026-07-16

- IR and Raman teaching envelopes for all majors
- Technique tabs, spectrum overlay compare, figure card PNG
- Catalog expanded to ~494 compounds

## [0.1.0] — 2026-07-16

- Initial public base: UV–Vis teaching set, search, properties, 3D viewer
