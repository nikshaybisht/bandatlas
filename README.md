# MolSpectra

[![Version](https://img.shields.io/badge/version-0.1.0-blue.svg)](https://github.com/nikshaybisht/molspectra)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

Public, shippable **UV–Vis molecule explorer** inspired by [PhotochemCAD](https://www.photochemcad.com/) (scientific metadata + families) and clear popular-science spectrometry visuals (graphs normal people can read).

**Current release: `v0.1.0` (base)** — search, UV–Vis graphs, properties, 3D. IR / Raman / large-scale catalog come in later versions.

## Features (v0.1 base)

- **Search** ~350 major molecules (name, CAS, formula, SMILES)
- **12 chemical families**
- **25 full UV–Vis teaching spectra** with solvent, λ<sub>max</sub>, ε-style Y-axis, optional fluorescence
- **Simple / Advanced** plot modes + plain-language captions
- **Rotating ball-and-stick 3D** (PubChem conformers via 3Dmol.js)
- **Property card**: family, CAS, formula, MW, SMILES, technique availability
- Static web app — deploy to Cloudflare Pages / Vercel / any static host

## Quick start (base)

```bash
cd molspectra
npm install
npm run dataset   # builds public/dataset (~350 molecules, 25 full UV–Vis)
npm run dev       # http://localhost:5173
```

Production build:

```bash
npm run build
npm run preview
```

### Base checklist (golden molecules)

Open the app and try: **rhodamine**, **caffeine**, **benzene**, **water**.

- Full-spectrum molecules show a readable UV–Vis plot (Simple mode by default)
- Catalog-only molecules show properties + 3D without crashing
- IR / Raman tabs stay disabled until later phases


## Project layout

```
apps style (single package for MVP)
  src/                 React UI (TypeScript)
  public/dataset/      Generated index + compound JSON
  tools/build-dataset.mjs
```

## Data notes

- **Tier A (full):** educational multi-Gaussian curves shaped to literature λ<sub>max</sub> / relative ε for teaching. Not raw instrument digitizations — use primary papers for research claims.
- **Tier C (catalog):** searchable majors with structure/properties; spectrum tabs show “not curated yet”; 3D still loads from PubChem when online.
- IR / Raman tabs are reserved in the UI for later dataset releases.
- Not affiliated with PhotochemCAD. Do not redistribute PhotochemCAD’s proprietary `.db` without permission.

## Stack

| Piece | Choice |
|-------|--------|
| UI | React + TypeScript + Vite |
| Search | MiniSearch (client-side) |
| Plots | uPlot |
| 3D | 3Dmol.js + PubChem SDF |
| Ship | Static files (no backend required) |

## Next expansions

1. Digitize / license more experimental full curves (NIST, open literature)
2. IR + Raman techniques
3. Spectrum compare mode
4. PWA offline cache
5. Optional Tauri desktop shell

## Versioning

| Tag | Meaning |
|-----|---------|
| **v0.1.0** | Base: UV–Vis + search + 3D + properties |
| v0.2.x | Planned: IR seed, graph polish |
| v0.3.x | Planned: Raman + larger catalog |
| v1.0.0 | Planned: production-ready multi-technique |

## License

- **Code:** [MIT](LICENSE)
- **Dataset packaging:** CC-BY-4.0 with per-entry source notes in compound JSON
- Not affiliated with PhotochemCAD
