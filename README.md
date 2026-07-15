# MolSpectra

[![Version](https://img.shields.io/badge/version-0.3.0-blue.svg)](https://github.com/nikshaybisht/molspectra)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

Public, shippable **multi-technique molecule explorer** — clear spectra anyone can understand.

Inspired by [PhotochemCAD](https://www.photochemcad.com/) (scientific metadata + families) and popular spectrometry teaching visuals (UV, IR, Raman, plain-language peaks).

**Current release: `v0.3.0`**

## Features

- **Search ~500 major molecules** (name, CAS, formula, SMILES)
- **Techniques:** UV–Vis · Fluorescence · **IR** · **Raman**
- **Simple / Advanced** graphs with peak labels and teaching captions
- **Compare** two molecules on the same technique
- **Share card PNG** + copy summary
- Family, solvent/conditions, properties
- Rotating **ball-and-stick 3D** (PubChem + 3Dmol.js)
- Static web app — deploy anywhere

## Dataset (v0.3)

| Kind | Count (approx.) |
|------|------------------|
| Searchable majors | ~494 |
| Full UV–Vis teaching curves | 25 |
| IR teaching envelopes | all majors |
| Raman teaching envelopes | all majors |

Teaching multi-Gaussian envelopes shaped to typical λ_max / functional-group wavenumbers. **Not raw instrument digitizations** — verify primary literature for research use.

## Quick start

```bash
cd molspectra
npm install
npm run dataset
npm run dev
```

Production:

```bash
npm run build
npm run preview
```

### Golden checks

Try: **rhodamine**, **caffeine**, **benzene**, **water**, **acetone**

- Switch tabs: UV–Vis / IR / Raman  
- Simple mode captions should read clearly  
- Compare button on a second molecule  
- Share card PNG  

## Stack

| Piece | Choice |
|-------|--------|
| UI | React + TypeScript + Vite |
| Search | MiniSearch |
| Plots | uPlot |
| 3D | 3Dmol.js + PubChem SDF |
| Ship | Static files |

## Versioning

| Tag | Meaning |
|-----|---------|
| v0.1.0 | Base: UV–Vis + search + 3D |
| **v0.3.0** | IR + Raman + compare + share + larger catalog |
| v1.0.0 | Planned: experimental curves, PWA, polish |

## Project layout

```
src/                 React UI
public/dataset/      Generated index + compound JSON
tools/
  build-dataset.mjs  UV–Vis seed + index
  ir-raman-lib.mjs   IR/Raman profiles + extra majors
```

## License

- **Code:** [MIT](LICENSE)
- **Dataset packaging:** CC-BY-4.0 with per-entry source notes
- Not affiliated with PhotochemCAD
