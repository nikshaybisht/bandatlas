# BandAtlas — project handoff

> **Repo copy.** Machine mirror: `C:\Users\Niksh\Documents\github\bandatlas\HANDOFF.md`

**Project name:** BandAtlas  
**Author:** Nikshay Bisht ([@nikshaybisht](https://github.com/nikshaybisht))  
**Repository:** https://github.com/nikshaybisht/bandatlas  
**Live demo:** https://nikshaybisht.github.io/bandatlas/  
**Latest release:** [v0.6.0](https://github.com/nikshaybisht/bandatlas/releases/tag/v0.6.0)  
**Local app (dev):** `C:\Users\Niksh\molspectra` (folder name is historical; product is **BandAtlas**)  
**Package version:** `0.6.0`  
**Updated:** 2026-07-16  

---

## What it is

Browser tool for **small-molecule UV–Vis, IR, and Raman** spectra:

| Feature | Status |
|---------|--------|
| Search (name, CAS, formula) | Yes — top search dropdown only (no left sidebar) |
| Filter: Has full UV–Vis | Yes |
| UV / catalog badges in search | Yes |
| UV–Vis + fluorescence emission toggle | Yes (when emission data exists) |
| IR / Raman teaching envelopes | Yes (all majors) |
| Overlay compare | Yes (`Overlay` on search hit) |
| Zoom in / out / reset + drag-box zoom | Yes |
| Peak λ labels (no boxes), thick smooth curves | Yes |
| Continuous rainbow band **below** x-axis (IG-style) | Yes — smooth prism strip, not pixel blocks |
| 3D ball-and-stick (PubChem) + spin on/off | Yes |
| Export CSV / JSON / figure PNG | Yes (collapsed **Export**) |
| Data & references | Yes (collapsed; short quality note) |
| Dark / light theme | Yes (`localStorage`: `bandatlas-theme`) |
| GitHub Pages live demo | Yes |
| Minimal automated tests | Yes (`npm test`) |

**Not** a certified spectral library. Many curves are **teaching envelopes** (multi-Gaussian / group-frequency models), not raw instrument digitizations. Cite **primary literature** for experimental numbers; cite BandAtlas only as software (`CITATION.cff`).

---

## Run locally

```bash
cd C:\Users\Niksh\molspectra
npm ci
npm run dataset
npm run dev
```

Open the URL Vite prints (often `http://127.0.0.1:5173`).

```bash
npm run ci          # dataset + tests + typecheck + build
npm run build
npm run preview
```

Vite `base`: `/` locally; `/bandatlas/` when `GITHUB_ACTIONS=true` or `VITE_BASE=/bandatlas/`.

---

## Dataset (current build)

| Content | Count |
|---------|------:|
| Searchable compounds | 494 |
| Full UV–Vis teaching curves | **51** |
| IR teaching envelopes | 494 |
| Raman teaching envelopes | 494 |

`npm run dataset` writes `public/dataset/` and `summary.json`.

---

## Stack

| Layer | Choice |
|-------|--------|
| UI | React 19 + TypeScript + Vite |
| Search | MiniSearch |
| Plots | uPlot |
| 3D | 3Dmol.js + PubChem SDF |
| Dataset | Static JSON under `public/dataset/` |
| Host | GitHub Pages (Actions) |
| Tests | Node `node:test` |

---

## Product decisions (do not reverse casually)

1. **Name is BandAtlas** — not MolSpectra / Chromoscope / Chromascope.  
2. **No left sidebar** — search dropdown only.  
3. **No SMILES** in the property card.  
4. **Solvent:** `solvent = …`  
5. **No “Value / Relative absorbance”** axis clutter.  
6. **Cite spectra from primary sources**, not the app.  
7. **IG-style spectrum:** continuous prism rainbow **below** x-axis.  
8. **Theme:** dark default + light; key `bandatlas-theme`.  
9. **Teaching honesty** always visible (badges, empty states, footer).  

---

## Contact / ownership

**Nikshay Bisht** — sole author and maintainer for this handoff.
