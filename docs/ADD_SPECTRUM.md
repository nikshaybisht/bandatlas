# Add a UV–Vis teaching curve

Teaching envelopes only — multi-Gaussian shapes constrained to literature λ_max. **Not** instrument files. Don’t set `quality: experimental` on these.

## Steps

1. Copy template:

   ```bash
   cp data/uv-seeds/_template.json data/uv-seeds/my-dye.json
   ```

   Files starting with `_` are ignored.

2. Fill in `id`, `name`, family, formula, PubChem CID or SMILES, solvent, `lambda_max_nm`, peaks (`lambda` / `height` / `sigma`), plot window, and a source note (`abs.lit` or `abs.quality_note`). Real λ_max from a paper or handbook, not vibes.

3. Check + rebuild:

   ```bash
   npm run validate:seeds
   npm run dataset
   npm run dev
   ```

4. Search your id → UV–Vis → should show **Teaching envelope**.

5. Optional: add id to `LAB_SET` in `tools/build-dataset.mjs` only if it has full UV (build enforces this).

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
