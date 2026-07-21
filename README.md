<div align="center">

# BandAtlas

**A browser atlas of small-molecule UV–Vis, IR, Raman, teaching ¹H/¹³C NMR, and MS bands.**

Structures via PubChem · quality tags on every curve · CSV/JSON export for lab notes

[![Live demo](https://img.shields.io/badge/live-demo-brightgreen?logo=githubpages&logoColor=white)](https://nikshaybisht.github.io/bandatlas/)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![CI](https://github.com/nikshaybisht/bandatlas/actions/workflows/ci.yml/badge.svg)](https://github.com/nikshaybisht/bandatlas/actions/workflows/ci.yml)
[![DOI](https://img.shields.io/badge/cite-CITATION.cff-orange)](CITATION.cff)

</div>

---

![BandAtlas explorer — Rhodamine B, UV–Vis with emission](docs/images/screenshot-uvvis.png)

## What it is

A static React app for browsing ~505 small-molecule records. Search a compound, open UV–Vis / IR / Raman / teaching **¹H·¹³C NMR** / **MS**, overlay a second structure, and export a note pack for lab write-ups. There’s a curated **Lab** set (~35 full-UV compounds) and an optional quick tour on the explorer.

Most UV/IR/Raman curves are **teaching envelopes** — multi-Gaussian / group-frequency shapes pinned to literature λ_max or textbook cm⁻¹. NMR and MS pilots are teaching multiplet/stick schematics (literature values often disagree across papers). A few slots exist for real open experimental series (`data/experimental/`); that count is basically zero for now.

**Don’t cite teaching curves as instrument SI.** Use primary literature for research numbers. See [docs/methodology.md](docs/methodology.md).

PhotochemCAD-style layout ideas; not affiliated with PhotochemCAD.

## Screenshots

| UV–Vis + emission | IR |
|:---:|:---:|
| ![UV–Vis](docs/images/screenshot-uvvis.png) | ![IR](docs/images/screenshot-ir.png) |

| Raman | ¹H NMR (teaching) |
|:---:|:---:|
| ![Raman](docs/images/screenshot-raman.png) | ![NMR](docs/images/screenshot-nmr.png) |

| MS (EI teaching) | Overlay / compare |
|:---:|:---:|
| ![MS](docs/images/screenshot-ms.png) | ![Compare](docs/images/screenshot-compare.png) |

| Light theme | Lab / export |
|:---:|:---:|
| ![Light theme](docs/images/screenshot-light.png) | ![Export](docs/images/screenshot-export.png) |

Screenshots under `docs/images/` are refreshed with the project’s Playwright capture tool when the UI changes.

## Features

- **Search & browse** ~505 compounds by name, CAS, formula, or SMILES
- **Six techniques** — UV–Vis, IR, Raman, teaching **¹H / ¹³C NMR** (60 & 500 MHz), and **MS** (EI / ESI / HRMS / MALDI teaching sticks on the pilot set)
- **Overlay mode** — drop a second spectrum on the same axes for comparison
- **3D structures** via 3Dmol, with local SDF → PubChem fallback
- **Quality tags** on every curve, plus availability pills (full UV vs catalog-only)
- **Export** — CSV, JSON, and a formatted Lab Note Pack
- **Share** — figure PNG, markdown, BibTeX for a given compound
- **Lab companion set** — ~35 curated full-UV compounds for teaching
- **Offline structure cache** — committed SDFs for the lab set
- **Accessibility** — keyboard focus, 375px mobile layout, reduced-motion support

## Run it

1. Clone this repository and install dependencies with the lockfile (`package.json` / `package-lock.json`).
2. Build the static dataset (scripts in `package.json` under `dataset` / related names).
3. Start the Vite development server (`dev` script). The app is usually at `http://127.0.0.1:5173`.
4. For a full check before a pull request, use the `ci` script. End-to-end smokes use Playwright after a production build (`test:e2e`).

GitHub Pages uses base `/bandatlas/` (set via `GITHUB_ACTIONS` or `VITE_BASE`). Locally the base is `/`.

## Dataset (rough)

Counts come from `public/dataset/summary.json` after a dataset rebuild:

- ~505 searchable compounds (identity + IR/Raman teaching models)
- ~126 full UV–Vis teaching envelopes (`data/uv-seeds/`)
- ~379 catalog-only for UV (searchable; no full UV curve yet)
- real open experimental series: **0** so far (schema path ready under `data/experimental/`)
- teaching NMR pilot: **15** compounds with ¹H + ¹³C peak lists (`data/nmr-seeds/`) — see [docs/NMR_PLAN.md](docs/NMR_PLAN.md)
- teaching MS pilot: **15** compounds (`data/ms-seeds/`) — see [docs/MS_PLAN.md](docs/MS_PLAN.md); literature intensities often disagree across papers

IR/Raman curves are group-frequency teaching models, not instrument SI.  
External databases & package strategy: [docs/DATA_SOURCES.md](docs/DATA_SOURCES.md).  
Add a UV teaching seed: [docs/ADD_SPECTRUM.md](docs/ADD_SPECTRUM.md). Course bits under `docs/course/` if useful.

## Docs

- [Methodology](docs/methodology.md) — how the teaching curves are built
- [Add a spectrum](docs/ADD_SPECTRUM.md) — contributor path for UV seeds
- [Course materials](docs/course/) — Top 50 worksheet + instructor notes
- [PWA status](docs/PWA.md) · [A11y / mobile checklist](docs/A11Y_MOBILE_CHECKLIST.md)
- [Data sources & packaging](docs/DATA_SOURCES.md) · [NMR plan](docs/NMR_PLAN.md) · [MS plan](docs/MS_PLAN.md)
- [Contributing](CONTRIBUTING.md) · [Security](SECURITY.md) · [Changelog](CHANGELOG.md)

## Cite

```
Bisht, N. (2026). BandAtlas (v1.4.1) [Computer software].
https://github.com/nikshaybisht/bandatlas
Live: https://nikshaybisht.github.io/bandatlas/
```

`CITATION.cff` is in the repo. Always cite the original spectral paper for experimental values.

## License

MIT — Nikshay Bisht ([@nikshaybisht](https://github.com/nikshaybisht))
