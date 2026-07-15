# BandAtlas — project handoff

> Canonical copy for the repo. A mirror lives at  
> `Documents/github/bandatlas/HANDOFF.md` on the author’s machine.

**Project name:** BandAtlas  
**Author:** Nikshay Bisht ([@nikshaybisht](https://github.com/nikshaybisht))  
**Repository:** https://github.com/nikshaybisht/bandatlas  
**Handoff date:** 2026-07-16  

## What it is

Static web client for small-molecule **UV–Vis**, **IR**, and **Raman** records: search, structures, overlay, zoom, export, provenance. Teaching envelopes are labeled as such.

## Run

```bash
npm install
npm run dataset
npm run dev
```

## Stack

React + TypeScript + Vite · MiniSearch · uPlot · 3Dmol.js · static JSON dataset.

## Key decisions

- Product name **BandAtlas** (not Chromascope / MolSpectra).
- Search-only navigation (no class sidebar).
- Dark / light theme (`bandatlas-theme` in localStorage).
- Cite experimental spectra from primary sources, not this app.

## Paths

See `README.md`, `docs/methodology.md`, `tools/build-dataset.mjs`, `public/dataset/`.

## Next

Experimental spectrum ingestion, live Pages demo, larger curated set.
