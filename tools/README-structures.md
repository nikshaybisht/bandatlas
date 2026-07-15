# Structure cache (offline 3D)

BandAtlas loads ball-and-stick models from **local SDF first**, then PubChem.

## Layout

```
public/dataset/structures/
  manifest.json      # index of cached CIDs
  {pubchem_cid}.sdf  # PubChem SDF (3D preferred, else 2D)
```

## Rebuild

Requires network access to PubChem (one-time for maintainers):

```bash
# Ensure index exists so compound ids resolve to CIDs
npm run dataset
npm run structures
```

Script: `tools/cache-structures.mjs`

- Targets a curated list of ~20 full-UV teaching compounds + a few majors.
- Prefers `record_type=3d`, falls back to 2D SDF.
- Writes `manifest.json` with sizes and record type.
- Warns if total cache exceeds ~4 MiB.

## Runtime behaviour

1. `GET {base}dataset/structures/{cid}.sdf`
2. If missing/invalid → PubChem 3D → PubChem 2D
3. If all fail → clear empty state (no blank canvas)

## CI

Cached SDFs are **committed** so CI and GitHub Pages work offline without hitting PubChem.
Tests assert that at least five known CIDs have local files.
