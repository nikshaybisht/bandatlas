# BandAtlas

**A working atlas of molecular UV–Vis, IR, and Raman bands** — structures, class labels, provenance, and export for lab notes.

| | |
|---|---|
| **Live demo** | **https://nikshaybisht.github.io/bandatlas/** |
| **Source** | This repository |
| **Install** | `npm ci && npm run dataset && npm run dev` |

[![Release](https://img.shields.io/github/v/release/nikshaybisht/bandatlas?include_prereleases&label=release)](https://github.com/nikshaybisht/bandatlas/releases)
[![CI](https://github.com/nikshaybisht/bandatlas/actions/workflows/ci.yml/badge.svg)](https://github.com/nikshaybisht/bandatlas/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Author](https://img.shields.io/badge/author-Nikshay%20Bisht-0B3D91.svg)](https://github.com/nikshaybisht)

<p align="center">
  <img src="docs/images/screenshot-uvvis.png" alt="BandAtlas — UV–Vis (dark) with emission and colour band" width="860" />
</p>

<p align="center">
  <img src="docs/images/screenshot-ir.png" alt="Infrared spectrum" width="280" />
  <img src="docs/images/screenshot-raman.png" alt="Raman spectrum" width="280" />
  <img src="docs/images/screenshot-compare.png" alt="Overlay comparison" width="280" />
</p>

<p align="center">
  <img src="docs/images/screenshot-light.png" alt="BandAtlas light theme" width="860" />
</p>

---

## Overview

BandAtlas is a static web client for browsing common small molecules and their spectral records:

| | |
|---|---|
| **Techniques** | UV–Vis (± fluorescence), IR, Raman |
| **Structures** | Ball-and-stick 3D via PubChem conformers |
| **Compare** | Overlay a second compound on the same technique |
| **Export** | CSV / JSON for notebooks; figure card PNG; BibTeX stub |
| **Filters** | “Has full UV–Vis”; “Experimental only” (open instrument series) |
| **Quality** | Per-spectrum `teaching` vs `experimental` badges (never mixed up) |
| **Provenance** | Source notes and core literature DOIs in the UI |

Layout and photochemical metadata conventions are inspired by [PhotochemCAD](https://www.photochemcad.com/) (Lindsey *et al.*). BandAtlas is an **independent** project and is **not affiliated** with PhotochemCAD.

### What it is good for

- Teaching absorption colour relationships and IR group frequencies  
- Quick triage before a lab meeting (“do we have a UV curve for this dye?”)  
- Exporting a series into notes with an explicit source tag  

### Portfolio / interview demo

**Live:** https://nikshaybisht.github.io/bandatlas/ · **Guide:** [/guide](https://nikshaybisht.github.io/bandatlas/guide)

A stranger (PhD panel / internship) should understand the app and the builder’s skill in **60 seconds**.

| | |
|---|---|
| **In-app tour** | **Run 60s tour** in the top bar (or Guide / About) |
| **Script** | [docs/DEMO_SCRIPT.md](docs/DEMO_SCRIPT.md) — spoken monologue + click path |
| **Featured strip** | Six full-UV compounds on the home explorer |
| **Stack signal** | React/TS/Vite SPA, Node dataset pipeline, CI + Playwright, GitHub Pages (`/bandatlas/`) |
| **Honesty** | Teaching envelopes labeled; not a certified spectral library |

**60s bullet path**

1. Open live demo → optional **Run 60s tour**  
2. Search / featured chip → **Rhodamine B** UV teaching curve  
3. Switch **IR** (same molecule)  
4. Open **Export** (CSV/JSON with quality headers)  
5. Enable **Has full UV–Vis** filter  
6. Optional: `/lab` note pack + copy share link  

### Lab companion

Primary job: **before UV/IR discussion, open this compound and export a note pack.**

| | |
|---|---|
| **Open** | Live: […/bandatlas/lab](https://nikshaybisht.github.io/bandatlas/lab) · local: `/lab` |
| **Lab set** | ~35 curated compounds (solvents, aromatics, UV dyes, porphyrins, biomolecules) — **every** entry has a full UV–Vis teaching curve + IR/Raman |
| **Filters** | Lab set on by default; chips for UV dyes / Solvents / Aromatics / Porphyrins / Biomolecules |
| **Discussion card** | Name, formula, technique summary, λ_max, quality tag, source note |
| **Export Lab Note Pack** | CSV (active series) + JSON bundle + Markdown notebook snippet + figure PNG |
| **Share** | `/c/<id>?tech=uvvis` (also `ir`, `raman`) — **Copy link** on the discussion card |

Markdown notes always state `quality: teaching` (or experimental when real open series exist) and include compound id, CAS/CID when present, app version, timestamp, and URL.

Teaching honesty stays visible: empty UV never draws a blank “fake” chart — the UI states that no full UV curve exists and points to IR/Raman when available.

### What it is not

Many curves are **teaching envelopes** (multi-Gaussian shapes constrained to literature λ<sub>max</sub> or characteristic IR/Raman frequencies). They are **not** certified instrument digitizations and **not** a NIST-grade spectral archive. For publication SI, replace them with primary experimental data and cite the original source. Details: [docs/methodology.md](docs/methodology.md).

---

## Quick start

```bash
git clone https://github.com/nikshaybisht/bandatlas.git
cd bandatlas
npm ci
npm run dataset
npm run dev
```

Open the URL Vite prints (usually `http://127.0.0.1:5173`).

Production build and checks:

```bash
npm run ci          # dataset + unit tests + typecheck + vite build
npm run preview
```

### End-to-end smoke (Playwright)

Requires a production build (or an existing `dist/`):

```bash
npm run ci          # builds dist/
npm run test:e2e    # starts vite preview + Playwright smoke
```

What the smoke suite covers: home shell loads, search finds benzene, **Has full UV–Vis** filter hides catalog-only water, technique tabs switch without crash, CSV export downloads a file. PubChem is blocked in tests so 3D uses the **local SDF cache** only (no network flake).

On GitHub Actions: unit+build always; Playwright runs on push/PR to `main` after the unit job.

### Deploy base path

- **Local / default:** Vite `base` is `/`.
- **GitHub Pages (this repo):** `base` is `/bandatlas/` when `GITHUB_ACTIONS=true` or `VITE_BASE=/bandatlas/`.
- Override any time: `VITE_BASE=/your-prefix/ npm run build`.

---

## Dataset (current build)

Counts come from `npm run dataset` (also written to `public/dataset/summary.json`):

| Content | Count |
|---------|------:|
| Searchable compounds | ~496 |
| Full UV–Vis curves | **~103** (mostly teaching) |
| Real experimental series | **0** until open data is contributed |
| Schema demo (not for citation) | 1 (`schema-example-uv`) |
| IR / Raman teaching envelopes | all majors |

- **Teaching UV–Vis:** multi-Gaussian envelopes (Tier A) with literature λ<sub>max</sub>.  
- **Experimental:** open-redistribution instrument series via `data/experimental/` (see methodology).  
- **Catalog / partial:** identity + teaching IR/Raman only.  

Identities and 3D models: **PubChem**. Spectral construction: [docs/methodology.md](docs/methodology.md).

---

## Repository layout

```
src/                     React + TypeScript UI
public/dataset/          Built index, compound JSON, references
tools/
  build-dataset.mjs      UV–Vis seeds + index
  validate-seeds.mjs     UV teaching seed validation (`npm run validate:seeds`)
  ir-raman-lib.mjs       IR/Raman profiles + catalog stubs
  quality-helpers.mjs    Test contracts (UV flags, CSV markers)
  cache-structures.mjs   Offline PubChem SDF cache (`npm run structures`)
  README-structures.md
  capture-screenshots.mjs
data/uv-seeds/           Additive UV teaching seed JSON (see docs/ADD_SPECTRUM.md)
public/dataset/structures/  Cached SDF for demo compounds
tests/                   Node test runner (dataset / experimental / structures / seeds)
docs/ADD_SPECTRUM.md     15-minute path to add a UV teaching curve
docs/
  methodology.md
  images/                UI screenshots
.github/workflows/
  ci.yml                 npm run ci
  pages.yml              GitHub Pages deploy
CITATION.cff
CONTRIBUTING.md
CHANGELOG.md
```

---

## Citation

If BandAtlas helped your teaching material or analysis workflow:

```
Bisht, N. (2026). BandAtlas (v0.11.0) [Computer software].
https://github.com/nikshaybisht/bandatlas
Live demo: https://nikshaybisht.github.io/bandatlas/
```

Also see [`CITATION.cff`](CITATION.cff). Always cite **primary spectral literature** for experimental numbers.

Selected background references:

- Taniguchi & Lindsey, *Photochem. Photobiol.* **2018**, *94*, 290–327. [doi:10.1111/php.12860](https://doi.org/10.1111/php.12860)  
- NIST Chemistry WebBook (SRD 69)  
- Braslavsky, *Pure Appl. Chem.* **2007**, *79*, 293–465 (IUPAC photochemistry glossary)

---

## Author

**Nikshay Bisht** · [@nikshaybisht](https://github.com/nikshaybisht)

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Please keep teaching vs experimental data clearly labeled.

## Security

To report a vulnerability, see [SECURITY.md](SECURITY.md). Please do **not** open public issues for unfixed security problems.

---

## License

[MIT](LICENSE) © Nikshay Bisht
