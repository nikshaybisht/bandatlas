# Methodology

Notes on how BandAtlas spectra are built. Not a paper.

## Identity

Names, formula, CAS when I have it, SMILES, PubChem CID. 3D: local SDF cache first (`public/structures/` or `public/dataset/structures/`), then PubChem 3D → 2D. Rebuild the structure cache with the project’s structures script (see README / `tools/README-structures.md`).

Class labels are teaching tags (dyes, solvents, PAHs…), not a formal ontology.

## quality field

Every spectrum has `quality`:

- **`teaching`** — multi-Gaussian or group-frequency model pinned to literature λ_max / characteristic cm⁻¹. UI: “Teaching envelope”.
- **`experimental`** — real instrument series with open redistribution rights + citation + DOI or URL. UI: “Experimental”.

Schema demo fixture uses `example_not_for_citation: true` so tooling can exercise the experimental path without claiming lab data we don’t have. Don’t cite that one.

Never relabel a teaching envelope as experimental.

## Teaching UV–Vis

Seeds live in `data/uv-seeds/*.json` (one file per compound). How to add one: [ADD_SPECTRUM.md](ADD_SPECTRUM.md).

Catalog-only compounds have no UV series — empty state in the UI, not a blank chart pretending to be data.

## IR / Raman

Characteristic frequencies from standard tables (Pretsch, Socrates, etc.). Always teaching for now.

## Experimental path

1. Confirm you can redistribute the series.
2. Drop JSON in `data/experimental/` (see README there).
3. Rebuild the dataset and check that the UI badge says **Experimental**.

Forbidden: copyrighted plot scrapes without a license; calling Gaussians “experimental”; shipping NIST-looking curves without checking terms.

Database research and package (offline) strategy: [DATA_SOURCES.md](DATA_SOURCES.md). NMR design: [NMR_PLAN.md](NMR_PLAN.md).

## Overlay / export

Overlays are qualitative. CSV/JSON headers carry `quality`, solvent, source, app version. Teaching disclaimer goes in the file on purpose.

## Use

Fine for teaching colour / group frequencies, triage before a meeting, notebook export with the quality tag visible.

Not fine for reporting teaching envelopes as measured facts.
