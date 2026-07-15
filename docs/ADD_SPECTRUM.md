# Add a UV–Vis teaching curve (~15 minutes)

BandAtlas UV curves are **teaching envelopes**: multi-Gaussian shapes constrained to literature λ<sub>max</sub>. They are **not** instrument digitizations. Do not label them experimental.

**You do not need to know the whole codebase.** This page is the complete path for a first UV seed PR.

**Forbidden:** inventing “experimental” instrument files or scraping copyrighted digitizations without redistribution rights. Real open experimental series use [`data/experimental/`](../data/experimental/README.md) only.

The dataset under `public/dataset/` is the app **backend**: `npm run dataset` builds index/summary/compound JSON and **fails** if schema validation rejects a record (`tools/validate-dataset.mjs`). Data flow overview: [ARCHITECTURE.md](ARCHITECTURE.md).

---

## 15-minute path (preferred)

1. Copy the template:

   ```bash
   cp data/uv-seeds/_template.json data/uv-seeds/my-dye.json
   ```

   (`_template.json` is **not** loaded — only files that do **not** start with `_`.)

2. Edit required fields (see below). Set real literature λ<sub>max</sub> in `abs.lambda_max_nm` and shape `abs.peaks` to match. Put a short source note in `abs.lit` or `abs.quality_note` (paper, handbook table, DOI).

3. Validate seeds + rebuild dataset (schema + flags):

   ```bash
   npm run validate:seeds
   npm run dataset
   # optional explicit check:
   npm run validate:dataset
   npm run dev
   ```

4. Search your compound in the app → UV–Vis tab → badge **Teaching envelope**. Index flags `hasFullUvVis` / `has_uvvis` must be true (computed at build — do not invent flags in React).

5. Optional lab companion: add the id to `LAB_SET` in `tools/build-dataset.mjs` **only if** it has full UV (validator enforces this).

6. Open a PR (one compound or a small batch).

---

## Path B — edit `tools/build-dataset.mjs`

Append an object to the `FULL` array (same schema as the JSON template). Then:

```bash
npm run validate:seeds   # external files + fixtures
npm run dataset          # also validates FULL + external seeds
```

---

## Required fields

| Field | Required | Notes |
|-------|----------|--------|
| `id` | **yes** | kebab-case slug, unique (`rhodamine-b`) |
| `name` | **yes** | Display name |
| `family` | **yes** | One of: `aromatic-hydrocarbons`, `pahs`, `dyes`, `xanthenes`, `coumarins`, `porphyrins`, `biomolecules`, `solvents`, `heterocycles`, `pharmaceuticals`, `food`, `quinones` |
| `formula` | **yes** | e.g. `C20H12O5` |
| `pubchem_cid` **or** `smiles` | **yes** | Prefer PubChem CID for 3D |
| `plain_summary` | **yes** | ≥12 chars, teaching-friendly |
| `quality` | optional | Must be `"teaching"` if set |
| `abs.solvent` | **yes** | Measurement / teaching solvent note |
| `abs.lambda_max_nm` | **yes** | Array of peak wavelengths (nm) |
| `abs.peaks` | **yes** | `[{ lambda, height, sigma }, …]` multi-Gaussian |
| `abs.xMin` / `abs.xMax` | **yes** | Plot window (nm), `xMin < xMax` |
| `abs.lit` **or** `abs.quality_note` | **yes** | Source note for λ_max (table, DOI, textbook) |
| `abs.plain_caption` | recommended | Short plot caption |
| `abs.epsilon_max` | optional | Same order as λ_max when known |
| `em` | optional | Emission envelope (same peak shape rules) |

### Example (valid fixture)

See [`tools/fixtures/uv-seed.example.json`](../tools/fixtures/uv-seed.example.json):

```json
{
  "id": "example-dye",
  "name": "Example dye (template only)",
  "family": "dyes",
  "formula": "C10H8",
  "smiles": "c1ccc2ccccc2c1",
  "pubchem_cid": 931,
  "quality": "teaching",
  "plain_summary": "Documented example seed for ADD_SPECTRUM.md — copy, rename id, set real λ_max.",
  "abs": {
    "solvent": "ethanol",
    "peaks": [
      { "lambda": 275, "height": 5000, "sigma": 12 },
      { "lambda": 310, "height": 2000, "sigma": 10 }
    ],
    "xMin": 240,
    "xMax": 380,
    "lambda_max_nm": [275, 310],
    "epsilon_max": [5000, 2000],
    "plain_caption": "Teaching envelope shaped to tabulated λ_max (example only).",
    "lit": "λ_max after textbook / PhotochemCAD-style table (example seed — replace with your source).",
    "quality_note": "Tier A teaching spectrum"
  }
}
```

---

## Choosing `peaks`

- Put a Gaussian near each literature λ_max (`lambda` ≈ peak nm).
- `height` ≈ relative ε (schematic is fine for teaching).
- `sigma` (nm) controls width (~8–20 for dyes; narrower for structured PAHs).
- Keep peaks inside `[xMin, xMax]`.

---

## Validation

```bash
npm run validate:seeds   # fixtures + data/uv-seeds/*.json
npm run dataset          # FULL array + data/uv-seeds; **fails the build on bad seeds**
```

Bad seeds (missing solvent, empty λ_max, wrong family, `quality: "experimental"` on a teaching seed, etc.) print errors and exit non-zero.

---

## Forbidden

- Setting `quality: "experimental"` on a teaching envelope (use `data/experimental/` for real open digitizations).
- Inventing λ_max with no source note.
- Copying copyrighted full traces without redistribution rights.
- Duplicate `id`s.

---

## After merge

Optional: cache a 3D SDF for demos:

```bash
# add your id to PRIORITY_IDS in tools/cache-structures.mjs if useful for offline demos
npm run structures
```

More methodology: [methodology.md](methodology.md).
