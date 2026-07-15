# MolSpectra

**Browser client for small-molecule UV–Vis, IR, and Raman records** — structures, solvent/conditions metadata, class labels, and export for notes/SI drafts.

[![Release](https://img.shields.io/badge/release-v0.4.0-0B3D91.svg)](https://github.com/nikshaybisht/molspectra/releases)
[![License: MIT](https://img.shields.io/badge/license-MIT-grey.svg)](LICENSE)

<p align="center">
  <img src="docs/images/screenshot-uvvis.png" alt="MolSpectra UV–Vis view" width="820" />
</p>

<p align="center">
  <img src="docs/images/screenshot-ir.png" alt="MolSpectra IR view" width="400" />
  &nbsp;
  <img src="docs/images/screenshot-compare.png" alt="Overlay comparison" width="400" />
</p>

---

## What this is (and is not)

MolSpectra is a **static web application** for:

- looking up common dyes, solvents, PAHs, biomolecules, etc.;
- inspecting **UV–Vis / fluorescence**, **IR**, and **Raman** series with peak annotations;
- overlaying two compounds on the same technique;
- exporting CSV/JSON for lab notebooks;
- reading **provenance and literature pointers** next to the plot.

It is **not** a certified spectral library. Many series are **teaching envelopes** (multi-Gaussian shapes constrained to literature λ_max or characteristic IR/Raman frequencies). They are useful for teaching and triage; they are **not** substitutes for primary experimental data in publications. See [docs/methodology.md](docs/methodology.md).

Design inspiration for layout and photochemical metadata: PhotochemCAD (Lindsey *et al.*). MolSpectra is an independent project and is **not affiliated** with PhotochemCAD.

---

## Features (v0.4)

| Area | Status |
|------|--------|
| Search (name, CAS, formula, SMILES) | ~500 compounds |
| UV–Vis teaching curves | 25 full envelopes |
| IR / Raman teaching envelopes | all majors |
| Teaching / Research display modes | yes |
| Overlay (qualitative compare) | yes |
| Export CSV / JSON / BibTeX stub | yes |
| Figure card PNG | yes |
| 3D structure (PubChem conformer) | yes |
| References panel + `CITATION.cff` | yes |

---

## Quick start

```bash
git clone https://github.com/nikshaybisht/molspectra.git
cd molspectra
npm install
npm run dataset
npm run dev
```

Open the URL printed by Vite (usually `http://127.0.0.1:5173`).

Production build:

```bash
npm run build
npm run preview
```

---

## Repository layout

```
src/                    React + TypeScript client
public/dataset/         Built index, compound JSON, references.json
tools/
  build-dataset.mjs     UV–Vis seeds + index assembly
  ir-raman-lib.mjs      IR/Raman profiles, extra catalog entries
docs/
  methodology.md        Data construction and limitations
  images/               UI screenshots
CITATION.cff            Software citation
CONTRIBUTING.md
CHANGELOG.md
```

---

## Data provenance (short)

1. **Identity / 3D:** PubChem (CID, synonyms, SDF conformers).  
2. **UV–Vis teaching set:** multi-Gaussian series guided by tabulated λ_max / relative ε (PhotochemCAD literature compilation and standard photochemistry sources — see References in-app).  
3. **IR / Raman teaching set:** characteristic group frequencies (e.g. Pretsch; Socrates).  
4. **Export headers** carry solvent/conditions strings and source notes for SI hygiene.

When you publish numbers, **cite the primary experimental paper or database**, not only MolSpectra.

### Suggested software citation

```
Bisht, N. (2026). MolSpectra (v0.4.0) [Computer software].
https://github.com/nikshaybisht/molspectra
```

Or use the GitHub “Cite this repository” flow via `CITATION.cff`.

Key background literature (non-exhaustive): Taniguchi & Lindsey, *Photochem. Photobiol.* **2018**, *94*, 290–327 ([doi:10.1111/php.12860](https://doi.org/10.1111/php.12860)); NIST Chemistry WebBook; Braslavsky, *Pure Appl. Chem.* **2007**, *79*, 293–465.

---

## Intended research workflow

1. Search the compound of interest.  
2. Check which techniques exist and the **provenance box** under the plot.  
3. Overlay a standard (e.g. anthracene, rhodamine B) for qualitative shape discussion.  
4. Export CSV for notes; replace teaching points with your instrument data before SI.  
5. Cite primary sources + software if the tool informed analysis or teaching material.

A longer methods note suitable for expansion into a short application note / white paper is in `docs/methodology.md`.

---

## Roadmap toward experimental archives

- [ ] Ingest open experimental UV/Vis where redistribution is allowed (e.g. NIST) with per-spectrum DOIs  
- [ ] UI filter: `experimental` vs `teaching-model`  
- [ ] Larger curated set with solvent/temperature tables  
- [ ] Optional PWA offline cache of the index  
- [ ] Hosted demo (GitHub Pages / lab static host)

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Data honesty is non-negotiable: never label a synthetic envelope as experimental.

---

## License

Code: [MIT](LICENSE). Dataset packaging is intended for open reuse with attribution; individual spectrum `source` fields may impose additional citation requirements.
