# BandAtlas

Browser atlas of small-molecule **UV–Vis**, **IR**, and **Raman** bands. Structures via PubChem, quality tags on every curve, CSV/JSON export for lab notes.

**Live:** https://nikshaybisht.github.io/bandatlas/

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

## What it is

Static React app. Search ~500 compounds, open a spectrum, compare overlays, export a note pack. There’s a curated **Lab** set (~35 full-UV compounds) and an optional quick tour on the explorer.

Most UV/IR/Raman curves are **teaching envelopes** — multi-Gaussian / group-frequency shapes pinned to literature λ_max or textbook cm⁻¹. A few slots exist for real open experimental series (`data/experimental/`). Right now that count is basically zero; the schema is ready if you have redistribution rights.

**Don’t cite teaching curves as instrument SI.** Use primary literature for research numbers. See [docs/methodology.md](docs/methodology.md).

PhotochemCAD-style layout ideas; not affiliated with PhotochemCAD.

## Dataset (rough)

From `npm run dataset` → `public/dataset/summary.json`:

- ~496 searchable compounds  
- ~103 full UV–Vis curves (teaching)  
- IR/Raman teaching models on the majors  
- experimental open series: 0 so far  

Add a UV teaching seed: [docs/ADD_SPECTRUM.md](docs/ADD_SPECTRUM.md). Course bits under `docs/course/` if useful.

## Cite

```
Bisht, N. (2026). BandAtlas (v1.1.1) [Computer software].
https://github.com/nikshaybisht/bandatlas
Live: https://nikshaybisht.github.io/bandatlas/
```

`CITATION.cff` is in the repo. Always cite the original spectral paper for experimental values.

## License

MIT — Nikshay Bisht ([@nikshaybisht](https://github.com/nikshaybisht))
