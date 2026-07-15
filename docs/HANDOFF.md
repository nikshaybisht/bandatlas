# BandAtlas — project handoff

> **Repo copy.** Machine mirror: `C:\Users\Niksh\Documents\github\bandatlas\HANDOFF.md`

**Project name:** BandAtlas  
**Author:** Nikshay Bisht ([@nikshaybisht](https://github.com/nikshaybisht))  
**Repository:** https://github.com/nikshaybisht/bandatlas  
**Latest release:** [v0.5.1](https://github.com/nikshaybisht/bandatlas/releases/tag/v0.5.1)  
**Updated:** 2026-07-16  

---

## What it is

Static web client for small-molecule **UV–Vis** (optional fluorescence), **IR**, and **Raman**:

- Top search only (no class sidebar)
- Overlay compare, zoom in/out/reset, drag-box zoom
- Continuous rainbow colour band **below** the wavelength axis (IG-style)
- Smooth abs/em curves; peak λ numbers without boxes
- 3D structure via PubChem
- Collapsible **Export** and **Data & references**
- Dark / light theme (`localStorage`: `bandatlas-theme`)
- Teaching envelopes labeled honestly — not a certified spectral archive

---

## Run

```bash
npm install
npm run dataset
npm run dev
```

```bash
npm run build
npm run preview
```

Refresh README screenshots:

```bash
npm run build
npx vite preview --host 127.0.0.1 --port 4173
node tools/capture-screenshots.mjs http://127.0.0.1:4173
```

---

## Stack

React 19 + TypeScript + Vite · MiniSearch · uPlot · 3Dmol.js · static JSON dataset.

---

## Layout

| Path | Role |
|------|------|
| `src/App.tsx` | Shell, search, theme |
| `src/App.css` | Dark/light tokens |
| `src/components/SpectrumPlot.tsx` | Plots, zoom, rainbow band, peaks |
| `src/components/MoleculeViewer.tsx` | 3D |
| `src/components/PropertyCard.tsx` | Metadata (`solvent = …`) |
| `tools/build-dataset.mjs` | UV seeds + index |
| `tools/ir-raman-lib.mjs` | IR/Raman + catalog |
| `public/dataset/` | Built data |
| `docs/images/` | README screenshots (uvvis, ir, raman, compare, light) |
| `docs/methodology.md` | Data construction & limits |
| `CITATION.cff` / `SECURITY.md` | Cite software / report vulns |

---

## Dataset (~current)

| Content | Count |
|---------|--------|
| Searchable compounds | ~494 |
| Full UV–Vis teaching curves | 25 |
| IR / Raman teaching envelopes | all majors |

---

## Product rules

1. Name is **BandAtlas** (not Chromascope — taken for mass-spec).  
2. No SMILES in UI; no left class/hits panel.  
3. No “Value / Relative absorbance” y-legend clutter.  
4. No long Provenance blurb under the plot (Research).  
5. Cite experimental spectra from **primary sources**.  
6. Theme must use CSS variables + remount plot/3D on toggle.  

---

## Git

```
origin  https://github.com/nikshaybisht/bandatlas.git
```

Releases: v0.1 → v0.3 → v0.4.x → **v0.5.0** (brand) → **v0.5.1** (theme + handoff) → `main` (screenshots).

---

## Next

- Experimental spectrum ingestion (NIST / literature DOIs)  
- GitHub Pages live demo  
- Rename local folder `molspectra` → `bandatlas` (optional)  

---

## Owner

**Nikshay Bisht** — sole author and maintainer.
