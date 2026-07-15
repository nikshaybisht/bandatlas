# Structure cache (offline 3D)

BandAtlas loads ball-and-stick models from **local SDF first**, then PubChem (timeout + one retry). Spectrum/search UI never waits on 3D.

## Layout

```
public/structures/
  manifest.json
  {pubchem_cid}.sdf     # primary airplane-mode path

public/dataset/structures/
  manifest.json         # mirrored (legacy + tests)
  {pubchem_cid}.sdf
```

## Rebuild (maintainers only — network)

```bash
npm run dataset
npm run structures      # fetch-and-vendor; commit the SDF artifacts
```

Script: `tools/cache-structures.mjs`

- Targets **all labSet** compounds + **featured strip** IDs (~20–40).
- Prefers PubChem `record_type=3d`, falls back to 2D.
- Timeout 12s + one retry per URL.
- Reuses existing valid local files when present (safe partial re-runs).
- Writes both `public/structures/` and `public/dataset/structures/`.

## Runtime

1. `GET {base}structures/{cid}.sdf`
2. Else `GET {base}dataset/structures/{cid}.sdf`
3. Else PubChem 3D → PubChem 2D (8s timeout, 1 retry each)
4. Else friendly empty state — **plot and search keep working**

## CI / Pages

Cached SDFs are **committed** so unit tests, Playwright (PubChem blocked), and GitHub Pages work offline.
