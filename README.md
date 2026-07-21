<div align="center">

# BandAtlas

**A browser atlas of small-molecule UV–Vis, IR, and Raman bands.**

Structures via PubChem · quality tags on every curve · CSV/JSON export for lab notes

[![Live demo](https://img.shields.io/badge/live-demo-brightgreen?logo=githubpages&logoColor=white)](https://nikshaybisht.github.io/bandatlas/)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![CI](https://github.com/nikshaybisht/bandatlas/actions/workflows/ci.yml/badge.svg)](https://github.com/nikshaybisht/bandatlas/actions/workflows/ci.yml)
[![DOI](https://img.shields.io/badge/cite-CITATION.cff-orange)](CITATION.cff)

</div>

---

![BandAtlas explorer — Rhodamine B, UV–Vis with emission](docs/images/screenshot-uvvis.png)

## What it is

A static React app for browsing ~500 small-molecule spectra. Search a compound, open its UV–Vis / IR / Raman curve, overlay a second structure for comparison, and export a note pack for lab write-ups. There’s a curated **Lab** set (~35 full-UV compounds) and an optional quick tour on the explorer.

Most UV/IR/Raman curves are **teaching envelopes** — multi-Gaussian / group-frequency shapes pinned to literature λ_max or textbook cm⁻¹. A few slots exist for real open experimental series (`data/experimental/`). Right now that count is basically zero; the schema is ready if you have redistribution rights.

**Don’t cite teaching curves as instrument SI.** Use primary literature for research numbers. See [docs/methodology.md](docs/methodology.md).

PhotochemCAD-style layout ideas; not affiliated with PhotochemCAD.

## Screenshots

| UV–Vis + emission | IR |
|:---:|:---:|
| ![UV–Vis](docs/images/screenshot-uvvis.png) | ![IR](docs/images/screenshot-ir.png) |

| Raman | Overlay / compare |
|:---:|:---:|
| ![Raman](docs/images/screenshot-raman.png) | ![Compare](docs/images/screenshot-compare.png) |

| Light theme |
|:---:|
| ![Light theme](docs/images/screenshot-light.png) |

## Features

- **Search & browse** ~496 compounds by name, CAS, formula, or SMILES
- **Three techniques** per compound — UV–Vis, IR, Raman teaching curves
- **Overlay mode** — drop a second spectrum on the same axes for comparison
- **3D structures** via 3Dmol, with local SDF → PubChem fallback
- **Quality tags** on every curve, plus availability pills (full UV vs catalog-only)
- **Export** — CSV, JSON, and a formatted Lab Note Pack
- **Share** — figure PNG, markdown, BibTeX for a given compound
- **Lab companion set** — ~35 curated full-UV compounds for teaching
- **Offline structure cache** — committed SDFs for the lab set
- **Accessibility** — keyboard focus, 375px mobile layout, reduced-motion support

## Run it

```bash
git clone https://github.com/nikshaybisht/bandatlas.git
cd bandatlas
npm ci
npm run dataset
npm run dev
```

Usually lands on `http://127.0.0.1:5173`. Full check: `npm run ci`. E2E after a build: `npm run test:e2e`.

GitHub Pages uses base `/bandatlas/` (set via `GITHUB_ACTIONS` or `VITE_BASE`). Locally base is `/`.

## Dataset (rough)

From `npm run dataset` → `public/dataset/summary.json`:

- ~496 searchable compounds
- ~103 full UV–Vis curves (teaching)
- IR/Raman teaching models on the majors
- experimental open series: 0 so far

Add a UV teaching seed: [docs/ADD_SPECTRUM.md](docs/ADD_SPECTRUM.md). Course bits under `docs/course/` if useful.

## Docs

- [Methodology](docs/methodology.md) — how the teaching curves are built
- [Add a spectrum](docs/ADD_SPECTRUM.md) — contributor path for UV seeds
- [Course materials](docs/course/) — Top 50 worksheet + instructor notes
- [Contributing](CONTRIBUTING.md) · [Security](SECURITY.md) · [Changelog](CHANGELOG.md)

## Cite

```
Bisht, N. (2026). BandAtlas (v1.1.1) [Computer software].
https://github.com/nikshaybisht/bandatlas
Live: https://nikshaybisht.github.io/bandatlas/
```

`CITATION.cff` is in the repo. Always cite the original spectral paper for experimental values.

## License

MIT — Nikshay Bisht ([@nikshaybisht](https://github.com/nikshaybisht))
