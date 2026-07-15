# Methodology

BandAtlas is a browser client for browsing small-molecule spectral records (UV–Vis, IR, Raman), structures, and metadata. It is intended for teaching, rapid literature triage, and laboratory discussion—not as a closed archive of certified reference spectra.

## Compound identity

- Canonical names, formulae, CAS numbers (where known), SMILES, and PubChem CIDs are stored in the curated index.
- Three-dimensional coordinates are requested at runtime from PubChem (`record_type=3d`, with 2D SDF fallback).
- Class labels (e.g. PAHs, xanthenes, solvents) follow a PhotochemCAD-like teaching taxonomy and are not a formal chemical ontology.

## Spectral series

### Quality tags

Each spectrum JSON includes a `source` object with a free-text citation, optional license note, and a quality tag such as:

| Tag | Meaning |
|-----|---------|
| Tier A teaching spectrum | Multi-Gaussian UV–Vis envelope constrained to literature λ_max / relative ε |
| Teaching IR | Group-frequency envelope (characteristic cm⁻¹) |
| Teaching Raman | Simplified Raman-shift envelope |

**Teaching envelopes are not instrument digitizations.** Peak positions are chosen to match commonly tabulated λ_max or IR/Raman group frequencies for orientation. Relative intensities are schematic.

### UV–Vis

- Display series: wavelength (nm) vs ε (advanced) or normalized intensity (teaching mode).
- Emission overlays are normalized independently.
- Points are downsampled at build time for interactive display; CSV export writes the displayed series plus header metadata.

### IR / Raman

- Teaching envelopes use characteristic frequencies from standard tables (e.g. Pretsch *et al.*; Socrates).
- IR is plotted high → low cm⁻¹ (conventional).
- Functional-group chips annotate the strongest generated peaks.

## Comparison / overlay

The UI can overlay a second compound’s series for the active technique. Overlays are for qualitative comparison only (different solvents, normalizations, and envelope construction may apply).

## Export

- **CSV**: header comments (compound id, CAS, technique, solvent, source note) + `x,y` columns.
- **JSON**: compound metadata + active spectrum payload for notebooks.
- **BibTeX stub**: placeholder citation for the software record; replace with primary literature when reporting experimental values.

## Intended use in research workflows

Reasonable:

- Checking which techniques exist for a common dye/solvent before a lab meeting.
- Explaining λ_max colour relationships to students.
- Exporting a teaching series into notes with explicit provenance tags.

Not reasonable without primary data:

- Reporting absolute ε, quantum yields, or band positions as experimental facts from teaching envelopes alone.
- Using envelopes as SI spectra for publication.

## Future experimental ingestion

Planned (see README roadmap):

1. Import open UV/Vis series (e.g. NIST WebBook where redistribution terms allow).
2. Attach DOI-level citations per spectrum.
3. Flag `quality: experimental` vs `quality: teaching-model` in the UI filter.

## Software citation

See `CITATION.cff` and the References panel in the application. When citing PhotochemCAD or NIST data products, cite those works directly in addition to BandAtlas.
