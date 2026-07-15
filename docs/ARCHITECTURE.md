# Architecture (short)

BandAtlas is a **static SPA**. There is no application server. The “backend” is the dataset build that writes JSON into `public/`, which Vite ships to GitHub Pages.

## Data flow

```
data/uv-seeds/*.json          optional additive UV teaching seeds
data/experimental/*.json      optional open experimental overlays
tools/build-dataset.mjs       FULL[] + STUBS + IR/Raman models
        │
        ▼  npm run dataset
tools/validate-seeds.mjs      seed schema (teaching only)
tools/validate-dataset.mjs    built compound/index/summary schema
        │
        ▼
public/dataset/
  index.json                  search index + flags (hasFullUvVis, labSet, …)
  summary.json / health.json  counts for About UI + CI
  compounds/{id}.json         full spectra + availability.flags
  structures/{cid}.sdf        optional offline 3D (mirrored under public/structures/)
        │
        ▼  Vite base /bandatlas/ on Pages
src/                          React Router app
  Explorer / Lab / Guide      search, plot, export, recent (localStorage)
  lib/loadCompound.ts         fetch compounds/{id}.json
  lib/structures.ts           local SDF → PubChem (timeout/retry)
```

## Responsibilities

| Layer | Owns |
|-------|------|
| **Seeds** (`data/`, `FULL` in build script) | Literature λ_max, multi-Gaussian peaks, honesty notes |
| **Build** (`npm run dataset`) | Merge, IR/Raman envelopes, **compute flags**, write index/summary |
| **Validation** | Fail CI if teaching seeds claim experimental or flags disagree with series |
| **UI** | Read **build flags only** for UV/IR/Raman presence; never invent quality |
| **Export** | Lab Note Pack / CSV / figure with teaching disclaimer |

## Quality model

| `quality` | Meaning |
|-----------|---------|
| `teaching` | Multi-Gaussian / group-frequency **model** constrained to tabulated peaks |
| `experimental` | Open-redistribution instrument series only (`data/experimental/`) |

**Never** relabel teaching → experimental. See [methodology.md](methodology.md).

## Client routes

| Path | Role |
|------|------|
| `/` | Explorer + featured + recent |
| `/c/:id?tech=` | Deep link compound + technique |
| `/lab` | Lab companion set + note pack |
| `/guide`, `/about` | Portfolio / methodology |

## CI

```bash
npm run ci          # seeds + dataset + unit tests + tsc + vite build
npm run test:e2e    # Playwright (PubChem blocked; uses local SDF cache)
```

Pages deploy: `.github/workflows/pages.yml` builds with `VITE_BASE=/bandatlas/`.

## Contributor entry points

- Add UV teaching curve: [ADD_SPECTRUM.md](ADD_SPECTRUM.md) (~15 min)
- Contributing workflow: [../CONTRIBUTING.md](../CONTRIBUTING.md)
- Good first issues: https://github.com/nikshaybisht/bandatlas/labels/good%20first%20issue
