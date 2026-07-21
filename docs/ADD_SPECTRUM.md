# Add a UV–Vis teaching curve

Teaching envelopes only — multi-Gaussian shapes constrained to literature λ_max. **Not** instrument files. Don’t set `quality: experimental` on these.

## Steps

1. Copy `data/uv-seeds/_template.json` to `data/uv-seeds/<your-id>.json`.  
   Files starting with `_` are templates only and are ignored by the build.

2. Fill in `id`, `name`, family, formula, PubChem CID or SMILES, solvent, `lambda_max_nm`, peaks (`lambda` / `height` / `sigma`), plot window, and a source note (`abs.lit` or `abs.quality_note`). Real λ_max from a paper or handbook, not vibes.

3. Validate seeds and rebuild the dataset using the project scripts in the README, then open the app and confirm the badge says **Teaching envelope**.

4. Optional: add the id to `LAB_SET` in `tools/build-dataset.mjs` only if it has full UV (the build enforces this).

## Required fields (quick)

| Field | Notes |
|-------|--------|
| `id` | kebab-case, unique |
| `name`, `family`, `formula` | display / filter |
| `pubchem_cid` or `smiles` | CID preferred for 3D |
| `plain_summary` | short blurb |
| `abs.solvent`, `abs.lambda_max_nm`, `abs.peaks` | the curve |
| `abs.xMin` / `abs.xMax` | nm window |
| `abs.lit` or `abs.quality_note` | where λ_max came from |

Example fixture: `tools/fixtures/uv-seed.example.json`.

## Experimental data

Different path: `data/experimental/`. Only with clear redistribution rights. See [methodology.md](methodology.md).
