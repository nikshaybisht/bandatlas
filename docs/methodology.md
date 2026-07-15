# Methodology

BandAtlas is a browser client for browsing small-molecule spectral records (UV–Vis, IR, Raman), structures, and metadata. It is intended for teaching, rapid literature triage, and laboratory discussion—not as a closed archive of certified reference spectra.

## Compound identity

- Canonical names, formulae, CAS numbers (where known), SMILES, and PubChem CIDs are stored in the curated index.
- Three-dimensional coordinates are requested at runtime from PubChem (`record_type=3d`, with 2D SDF fallback).
- Class labels (e.g. PAHs, xanthenes, solvents) follow a PhotochemCAD-like teaching taxonomy and are not a formal chemical ontology.

## Spectral series

### Quality tags (required)

Every spectrum object carries an explicit **`quality`** field:

| `quality` | Meaning | UI badge |
|-----------|---------|----------|
| `teaching` | Multi-Gaussian / group-frequency **model** constrained to tabulated λ_max or characteristic cm⁻¹ | **Teaching envelope** |
| `experimental` | Instrument series with **open redistribution** rights and a primary citation (DOI and/or URL) | **Experimental** |

Optional flags / fields:

| Field | Meaning |
|-------|---------|
| `example_not_for_citation` | Synthetic **schema demo** only. Still stored as `quality: experimental` for tooling, but UI shows **Schema example** and it is **excluded** from the “Experimental only” filter. |
| `solvent` | Solvent or measurement conditions (required for experimental) |
| `temperature_K` | Absolute temperature if known |
| `source.citation` | Free-text citation (required) |
| `source.doi` / `source.url` | At least one required for experimental |
| `source.license` | Redistribution license note |
| `source.note` | Short quality note (e.g. `Tier A teaching spectrum`, `experimental digitization`) |

**Never relabel a teaching envelope as experimental.** Teaching multi-Gaussians stay `quality: "teaching"` forever.

### Teaching UV–Vis

- Full-curve seeds live in `tools/build-dataset.mjs` (`FULL` array).
- Catalog-only compounds have **no** UV series; the UI shows an empty state.
- Display series: wavelength (nm) vs ε (advanced) or normalized intensity (teaching mode).
- Rebuild counts: `npm run dataset` prints totals and writes `public/dataset/summary.json`.

### IR / Raman

- Teaching envelopes use characteristic frequencies from standard tables (e.g. Pretsch *et al.*; Socrates).
- Always `quality: "teaching"`.
- IR is plotted high → low cm⁻¹ (conventional).

## Adding experimental series (allowed path)

1. Confirm **redistribution rights** (CC-BY, CC0, author-owned lab export you may publish, database terms that allow reuse). If unclear, **do not add**.
2. Place a JSON file under `data/experimental/` (see `data/experimental/README.md`).
3. Required: `quality: "experimental"`, `solvent`, `source.citation`, `source.doi` **or** `source.url`, `display_points` (≥5 points), optional `temperature_K`.
4. Run `npm run dataset` then spot-check the compound in the UI (badge **Experimental**, Data & references DOI/URL).
5. Prefer additive PRs: one compound or one small batch of open series.

To attach to an existing catalog id, set `compound_id` to that id (e.g. `benzene`). To introduce a new molecule, set `create_if_missing: true` and provide a `compound` metadata block.

### Forbidden

- Digitized scans of **copyrighted** plots without a clear license.
- Calling multi-Gaussian teaching envelopes `experimental`.
- Shipping “NIST-looking” curves without verifying NIST WebBook / source redistribution terms.
- Omitting solvent / citation / DOI-or-URL on experimental records.
- Using the schema-demo compound as a citation for real chemistry.

### Schema demo shipped in-repo

`data/experimental/schema-example.json` is a **synthetic** multi-point series with  
`example_not_for_citation: true`. It exists so the pipeline, UI badges, and tests exercise the experimental path **without claiming open lab data that we do not have**. Real experimental count may be **zero** until open series are contributed.

## Comparison / overlay

Overlays are for qualitative comparison. Always read the quality badge on each series (teaching vs experimental vs schema example).

## Export

- **CSV**: header comments include `quality`, solvent, temperature, DOI, source note + `x,y` columns.
- **JSON**: compound metadata + active spectrum payload.
- **BibTeX stub**: software packaging citation only.

## Intended use

Reasonable:

- Teaching colour / group-frequency relationships from envelopes.
- Filtering to **Experimental only** when real open series exist.
- Exporting a series with explicit quality tags into notes.

Not reasonable:

- Reporting teaching envelopes as instrument facts.
- Citing the schema example as measured data.

## Software citation

See `CITATION.cff` and the References panel. When citing PhotochemCAD, NIST, or a primary paper, cite those works directly in addition to BandAtlas.
