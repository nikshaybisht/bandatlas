# BandAtlas — project handoff

> **Repo copy.** Machine mirror: `C:\Users\Niksh\Documents\github\bandatlas\HANDOFF.md`

**Project name:** BandAtlas  
**Author:** Nikshay Bisht ([@nikshaybisht](https://github.com/nikshaybisht))  
**Repository:** https://github.com/nikshaybisht/bandatlas  
**Latest release:** [v0.5.1](https://github.com/nikshaybisht/bandatlas/releases/tag/v0.5.1)  
**Local app (dev):** `C:\Users\Niksh\molspectra` (folder name is historical; product is **BandAtlas**)  
**Package version:** `0.5.1`  
**Updated:** 2026-07-16  

---

## What it is

Browser tool for **small-molecule UV–Vis, IR, and Raman** spectra:

| Feature | Status |
|---------|--------|
| Search (name, CAS, formula) | Yes — top search dropdown only (no left sidebar) |
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

**Not** a certified spectral library. Many curves are **teaching envelopes** (multi-Gaussian / group-frequency models), not raw instrument digitizations. Cite **primary literature** for experimental numbers; cite BandAtlas only as software (`CITATION.cff`).

---

## Run locally

```bash
cd C:\Users\Niksh\molspectra
npm install
npm run dataset
npm run dev
```

Open the URL Vite prints (often `http://127.0.0.1:5173`).

Production:

```bash
npm run build
npm run preview
```

Refresh README screenshots (requires Playwright browser already installed for the capture script):

```bash
npm run build
npx vite preview --host 127.0.0.1 --port 4173
# other terminal:
node tools/capture-screenshots.mjs http://127.0.0.1:4173
```

Outputs under `docs/images/`:

| File | Content |
|------|---------|
| `screenshot-uvvis.png` | Dark UV–Vis + emission + colour band |
| `screenshot-ir.png` | Infrared |
| `screenshot-raman.png` | Raman |
| `screenshot-compare.png` | Overlay compare |
| `screenshot-light.png` | Light theme |

---

## Stack

| Layer | Choice |
|-------|--------|
| UI | React 19 + TypeScript + Vite |
| Search | MiniSearch |
| Plots | uPlot |
| 3D | 3Dmol.js + PubChem SDF |
| Dataset | Static JSON under `public/dataset/` |
| Host | Static (optional GitHub Pages workflow in `.github/workflows/pages.yml`) |

---

## Repository layout

```
molspectra/                    # local clone; remote name = bandatlas
  src/
    App.tsx                    shell, search dropdown, theme toggle
    App.css                    dark + light CSS variables (full UI)
    components/
      SpectrumPlot.tsx         UV/IR/Raman, zoom, rainbow band, peaks, smooth em
      MoleculeViewer.tsx       3D; remounts on theme; spin on/off
      PropertyCard.tsx         CAS, formula, MW, solvent = … (no SMILES)
      ResearchTools.tsx        export (collapsed)
      CitationsPanel.tsx       data & refs (collapsed)
      ShareCard.tsx            figure PNG
  public/dataset/
    index.json
    compounds/*.json
    references.json
  tools/
    build-dataset.mjs          UV seeds + index
    ir-raman-lib.mjs           IR/Raman profiles + catalog stubs
    capture-screenshots.mjs    Playwright README shots
  docs/
    HANDOFF.md                 this handoff (repo copy)
    methodology.md
    images/                    README screenshots (refreshed on main)
  CITATION.cff
  SECURITY.md
  CONTRIBUTING.md
  CHANGELOG.md
  README.md
```

---

## Dataset (current build)

| Content | Approx. |
|---------|---------|
| Searchable compounds | ~494 |
| Full UV–Vis teaching curves | 25 |
| IR teaching envelopes | all majors |
| Raman teaching envelopes | all majors |

```bash
npm run dataset
```

---

## Product decisions (do not reverse casually)

1. **Name is BandAtlas** — not MolSpectra / Chromoscope / Chromascope (Chromascope is taken: mass-spec mzML GUI by adamcseresznye).  
2. **No left sidebar** (classes/hits) — search dropdown only.  
3. **No SMILES** in the property card.  
4. **Solvent:** `solvent = …`  
5. **No “Value / Relative absorbance”** axis/legend clutter — X shows `nm` or `cm⁻¹` only.  
6. **No long Provenance dump under the plot** in Research mode; detail only under **Data & references**.  
7. **Cite spectra from primary sources**, not the app.  
8. **IG-style spectrum:** continuous prism rainbow **below** x-axis (smooth, not blocky); smooth abs/em curves.  
9. **Theme:** dark (default soft charcoal) + light; key `bandatlas-theme`.  
10. **Emission:** toggle button when fluorescence data exists; curve colour = emitted light; abs colour ≈ solution appearance.  
11. **Peaks:** large λ numbers without boxes.  
12. **No drag-to-zoom instructional hint** clutter under the plot.  
13. **3D:** optional spin; remounts with theme background.  

---

## Theme notes (v0.5.1)

- CSS custom properties for both themes (`--bg`, `--panel`, `--plot-bg`, chips, folds, etc.).  
- Spectrum plot remounts on theme change (`key` includes `theme`).  
- 3D viewer remounts with matching background.  
- Toggle: **Light** / **Dark** in the top bar.  
- Peak label colours respect light theme.  

---

## Spectrum plot notes

- **UV–Vis:** dense x-grid + cubic sampling → continuous abs/emission (no polyline steps).  
- **IR:** ascending wavenumber array with `scale.dir = -1` (high → low display); do not reverse the data array.  
- **Zoom:** base scales stored for reset; UI zoom in/out/reset; drag-box zoom.  
- **Rainbow:** drawn under the x-axis after layout so it does not sit on the curve.  

---

## Git

```
origin  https://github.com/nikshaybisht/bandatlas.git
```

| Tag / ref | Meaning |
|-----------|---------|
| v0.1.0 | Early UV–Vis base (old name era) |
| v0.3.0 | IR/Raman multi-technique |
| v0.4.x | Research exports, SECURITY, intermediate branding |
| **v0.5.0** | BandAtlas brand |
| **v0.5.1** | Theme fix + handoff + spectrum polish |
| `main` | + refreshed README screenshots (`docs/images/*`, light theme shot) |

Author email for commits: `78500704+nikshaybisht@users.noreply.github.com` (keeps GitHub contributor graph linked).

---

## Known limitations / next work

- Teaching envelopes ≠ experimental digitizations  
- Ingest open experimental UV–Vis (e.g. NIST) with per-spectrum DOIs  
- Enable **GitHub Pages** (Settings → Pages → GitHub Actions) for live demo  
- Optional: rename local folder `molspectra` → `bandatlas`  
- Optional: more full UV–Vis curves beyond the 25 teaching set  

---

## Contact / ownership

**Nikshay Bisht** — sole author and maintainer for this handoff.
