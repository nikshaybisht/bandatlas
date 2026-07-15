# Changelog

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
