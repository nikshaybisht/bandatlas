# BandAtlas — project handoff

> **Repo copy.** Machine mirror: `C:\Users\Niksh\Documents\github\bandatlas\HANDOFF.md`

**Project name:** BandAtlas  
**Author:** Nikshay Bisht ([@nikshaybisht](https://github.com/nikshaybisht))  
**Repository:** https://github.com/nikshaybisht/bandatlas  
**Live demo:** https://nikshaybisht.github.io/bandatlas/  
**Latest release:** [v0.9.0](https://github.com/nikshaybisht/bandatlas/releases/tag/v0.9.0)  
**Local app (dev):** `C:\Users\Niksh\molspectra` (folder name is historical; product is **BandAtlas**)  
**Package version:** `0.9.0`  
**Updated:** 2026-07-16  

---

## What it is

Browser tool for **small-molecule UV–Vis, IR, and Raman** spectra:

| Feature | Status |
|---------|--------|
| App routes | `/` explorer, `/c/:id?tech=`, `/lab`, `/guide`, `/about` |
| Lab companion | Lab set (35), chips, discussion card, note pack export |
| App chrome | Nav, version, theme, teaching banner, MIT footer |
| Search (name, CAS, formula) | Yes — explorer search dropdown only (no left sidebar) |
| Filter: Has full UV–Vis | Yes |
| Filter: Experimental only | Yes (excludes schema demos; 0 real experimental yet) |
| UV / catalog / Exp badges | Yes |
| UV–Vis + fluorescence emission toggle | Yes (when emission data exists) |
| IR / Raman teaching envelopes | Yes (all majors) |
| Overlay compare | Yes (`Overlay` on search hit; qualitative disclaimer) |
| Zoom in / out / reset | Yes; drag-box zoom on mouse; **off on touch** (use buttons) |
| Peak λ labels (no boxes), thick smooth curves | Yes |
| Continuous rainbow band **below** x-axis (IG-style) | Yes |
| Y-axis scale | **Normalized** / **Absolute scale** (not “Research”) |
| Always-on teaching / quality disclaimer under plot | Yes |
| 3D ball-and-stick | Local SDF cache first → PubChem 3D/2D fallback |
| Export CSV / JSON / figure PNG | Yes (collapsed **Export**) |
| Data & references | Yes (collapsed; quality + source) |
| Dark / light theme | Yes (`localStorage`: `bandatlas-theme`) |
| GitHub Pages live demo | Yes |
| Unit tests + Playwright e2e | Yes (`npm run ci`, `npm run test:e2e`) |
| UV seed contributor path | Yes (`docs/ADD_SPECTRUM.md`, `data/uv-seeds/`) |

**Not** a certified spectral library. Most UV curves are **teaching envelopes** (multi-Gaussian / group-frequency models), not raw instrument digitizations. Cite **primary literature** for experimental numbers; cite BandAtlas only as software (`CITATION.cff`).

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
npm run validate:seeds   # UV teaching seed schema
npm run ci               # seeds + unit tests + typecheck + build
npm run test:e2e         # Playwright smoke (needs dist/ from build)
npm run structures       # rebuild offline SDF cache (needs network)
npm run preview
```

Vite `base`: `/` by default. Pages sets `VITE_BASE=/bandatlas/`. Do **not** key base off bare `GITHUB_ACTIONS` (breaks e2e preview at `/`).

---

## Dataset (current build)

From `npm run dataset` → `public/dataset/summary.json`:

| Content | Count |
|---------|------:|
| Searchable compounds | **496** |
| Full UV–Vis curves | **103** (teaching; + optional experimental overlays) |
| Real experimental series | **0** |
| Schema demo (not for citation) | **1** (`schema-example-uv`) |
| Catalog / no full UV | **393** |
| IR teaching envelopes | **496** |
| Raman teaching envelopes | **496** |
| Offline SDF structures | **24** (~114 KB under `public/dataset/structures/`) |

---

## Stack

| Layer | Choice |
|-------|--------|
| UI | React 19 + TypeScript + Vite |
| Search | MiniSearch |
| Plots | uPlot |
| 3D | 3Dmol.js + local SDF + PubChem fallback |
| Dataset | Static JSON under `public/dataset/` |
| Host | GitHub Pages (Actions workflow) |
| Unit tests | Node `node:test` |
| E2E | Playwright (`e2e/smoke.spec.ts`) |

---

## Key paths

```
src/
  App.tsx                 shell, search, filters, theme, mode toggles
  App.css                 dark/light + responsive (375px) + focus-visible
  components/
    SpectrumPlot.tsx      plot, disclaimer, zoom (touch-safe)
    MoleculeViewer.tsx    3D; local cache then PubChem
    PropertyCard.tsx      quality + source for active series
    ResearchTools.tsx     Export fold (internal name; UI says Export)
    CitationsPanel.tsx    Data & references
tools/
  build-dataset.mjs       FULL UV seeds + stubs + experimental merge
  validate-seeds.mjs      npm run validate:seeds
  cache-structures.mjs    npm run structures
  ir-raman-lib.mjs
data/
  uv-seeds/               additive UV teaching JSON (_template not loaded)
  experimental/           open experimental overlays (quality: experimental)
public/dataset/
  index.json, summary.json, compounds/, structures/
docs/
  ADD_SPECTRUM.md         15-min UV seed path
  A11Y_MOBILE_CHECKLIST.md
  methodology.md
  HANDOFF.md              this file
.github/
  workflows/ci.yml        unit + Playwright
  workflows/pages.yml     deploy
  ISSUE_TEMPLATE/uv_teaching_curve.yml
```

---

## Product decisions (do not reverse casually)

1. **Name is BandAtlas** — not MolSpectra / Chromoscope / Chromascope.  
2. **No left sidebar** — search dropdown only.  
3. **No SMILES** in the property card.  
4. **Solvent:** `solvent = …`  
5. **Y-axis modes:** Normalized vs Absolute scale (ε) — **not** “Research mode”.  
6. **Cite spectra from primary sources**, not the app.  
7. **Teaching honesty** always visible (plot disclaimer, badges, empty states).  
8. **Never** label multi-Gaussian teaching envelopes as experimental.  
9. **Theme:** dark default + light; key `bandatlas-theme`.  
10. **IG-style spectrum:** continuous prism rainbow **below** x-axis.  

---

## Quality model

| `quality` | Meaning | UI |
|-----------|---------|-----|
| `teaching` | Multi-Gaussian / group-frequency model | Teaching envelope |
| `experimental` | Open-redistribution instrument series | Experimental |
| + `example_not_for_citation` | Synthetic schema demo | Schema example (not in “Experimental only”) |

- Teaching seeds: `FULL` in `build-dataset.mjs` and/or `data/uv-seeds/*.json`  
- Experimental: `data/experimental/*.json` only  

---

## Git / releases

```
origin  https://github.com/nikshaybisht/bandatlas.git
```

| Tag | Notes |
|-----|--------|
| v0.5.0 | BandAtlas brand |
| v0.5.1 | Theme + handoff |
| v0.6.0 | Live Pages demo |
| v0.6.1 | UV 51 → 102 |
| **v0.7.0** | Experimental quality schema |
| **v0.7.1** | Honest UI copy (Absolute scale, disclaimers) |
| **v0.7.2** | Mobile 375px, keyboard, touch zoom, a11y checklist |
| v0.8.0 | App shell: routes, chrome, onboarding, deep links, PWA-lite |
| **v0.9.0** | Lab companion: lab set, note pack, `?tech=` share links |

Author email for commits: `78500704+nikshaybisht@users.noreply.github.com`

---

## Known limitations / next work

- Teaching envelopes ≠ experimental digitizations  
- ~393 compounds still lack full UV–Vis  
- Real experimental count is **0** until open series are contributed  
- 3D for non-cached CIDs needs live PubChem  
- Optional: more UV seeds via `docs/ADD_SPECTRUM.md`; experimental path when redistribution is clear  

---

## Contact / ownership

**Nikshay Bisht** — sole author and maintainer for this handoff.
