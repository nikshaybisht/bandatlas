# Chromoscope

**A browser tool for small-molecule UV–Vis, IR, and Raman spectra** — with structures, class labels, provenance, and export for lab notes.

[![Release](https://img.shields.io/github/v/release/nikshaybisht/chromoscope?include_prereleases&label=release)](https://github.com/nikshaybisht/chromoscope/releases)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Author](https://img.shields.io/badge/author-Nikshay%20Bisht-0B3D91.svg)](https://github.com/nikshaybisht)

<p align="center">
  <img src="docs/images/screenshot-uvvis.png" alt="Chromoscope — UV–Vis view of a dye spectrum" width="860" />
</p>

<p align="center">
  <img src="docs/images/screenshot-ir.png" alt="Infrared view" width="420" />
  <img src="docs/images/screenshot-compare.png" alt="Overlay comparison" width="420" />
</p>

---

## Overview

Chromoscope is a static web client for browsing common small molecules and their spectral records:

| | |
|---|---|
| **Techniques** | UV–Vis (± fluorescence), IR, Raman |
| **Structures** | Ball-and-stick 3D via PubChem conformers |
| **Compare** | Overlay a second compound on the same technique |
| **Export** | CSV / JSON for notebooks; figure card PNG; BibTeX stub |
| **Provenance** | Source notes and core literature DOIs in the UI |

Layout and photochemical metadata conventions are inspired by [PhotochemCAD](https://www.photochemcad.com/) (Lindsey *et al.*). Chromoscope is an **independent** project and is **not affiliated** with PhotochemCAD.

### What it is good for

- Teaching absorption colour relationships and IR group frequencies  
- Quick triage before a lab meeting (“do we have a UV curve for this dye?”)  
- Exporting a series into notes with an explicit source tag  

### What it is not

Many curves are **teaching envelopes** (multi-Gaussian shapes constrained to literature λ<sub>max</sub> or characteristic IR/Raman frequencies). They are **not** certified instrument digitizations. For publication SI, replace them with primary experimental data and cite the original source. Details: [docs/methodology.md](docs/methodology.md).

---

## Quick start

```bash
git clone https://github.com/nikshaybisht/chromoscope.git
cd chromoscope
npm install
npm run dataset
npm run dev
```

Build for production:

```bash
npm run build
npm run preview
```

---

## Dataset (current build)

| Content | Approx. size |
|---------|----------------|
| Searchable compounds | ~500 |
| Full UV–Vis teaching curves | 25 |
| IR teaching envelopes | all majors |
| Raman teaching envelopes | all majors |

Identities and 3D models: **PubChem**. Spectral construction: see methodology.

---

## Repository layout

```
src/                     React + TypeScript UI
public/dataset/          Built index, compound JSON, references
tools/
  build-dataset.mjs      UV–Vis seeds + index
  ir-raman-lib.mjs       IR/Raman profiles + catalog stubs
  capture-screenshots.mjs
docs/
  methodology.md
  images/                UI screenshots
CITATION.cff
CONTRIBUTING.md
CHANGELOG.md
```

---

## Citation

If Chromoscope helped your teaching material or analysis workflow:

```
Bisht, N. (2026). Chromoscope (v0.4.1) [Computer software].
https://github.com/nikshaybisht/chromoscope
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
