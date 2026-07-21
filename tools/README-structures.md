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

1. Rebuild the compound dataset first so the index lists lab-set / featured CIDs.
2. Run the structure-cache script (`tools/cache-structures.mjs`; also exposed as the `structures` script in `package.json`).
3. Commit the resulting SDF artifacts under `public/structures/` (and the legacy mirror if updated).

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
