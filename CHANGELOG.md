# Changelog

## [Unreleased]

### Added
- **Local SDF structure cache** for top ~20 UV compounds + majors (`public/dataset/structures/`)
- 3D viewer: local cache first, then PubChem 3D/2D; clear empty state if both fail
- `npm run structures` (`tools/cache-structures.mjs`) + `tools/README-structures.md`
- Tests: at least 5 known CID SDF files present; soft size budget
- **Playwright e2e smoke** (`npm run test:e2e`): home, search, UV filter, technique tabs, CSV export
- CI: unit+build always; e2e job on push/PR to `main` (Chromium, PubChem blocked)

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
