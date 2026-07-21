# NMR upgrade plan (¹H, ¹³C, 60 MHz & 500 MHz)

Status: **v1 shipped (teaching pilot)** on branch `feature/nmr-1h-13c-upgrade`.
Explorer tabs **¹H NMR** / **¹³C NMR**, field toggle **60 MHz | 500 MHz**, seeds under
`data/nmr-seeds/`. Still teaching multiplet sketches — not instrument FIDs.
See [DATA_SOURCES.md](DATA_SOURCES.md) before importing open experimental series.

## Goals

- Teaching and (later) experimental **¹H** and **¹³C** for BandAtlas compounds.
- Compare **60 MHz** (teaching / classic CW-era resolution) vs **500 MHz** (modern high-field look).
- Optional later: ¹⁹F / ³¹P for subsets; 2D (COSY/HSQC) is out of scope for v1 NMR.

## Science notes (keep the product honest)

| Quantity | Depends on B₀? | How we store it |
|----------|----------------|-----------------|
| Chemical shift δ (ppm) | No (to first order) | Peak list in ppm |
| J couplings (Hz) | No | Optional multiplet parameters |
| Display in Hz / multiplet width | **Yes** | Simulate at 60 vs 500 MHz |
| Integration ratios | No | Integer / relative areas |

**Teaching spectra** = stick + Lorentzian envelopes from literature δ/J (like UV multi-Gaussians).  
**Experimental spectra** = digitized or deposited peak lists / FID-derived series with license + DOI.

Never claim a textbook multiplet sketch is a 500 MHz instrument file.

## Proposed seed shape (`data/nmr-seeds/<id>.json`)

```json
{
  "compound_id": "benzene",
  "quality": "teaching",
  "spectra": [
    {
      "id": "benzene-1h",
      "nucleus": "1H",
      "solvent": "CDCl3",
      "reference": "TMS",
      "temperature_K": 298,
      "plain_caption": "Single aromatic singlet (teaching).",
      "source": {
        "citation": "…",
        "lit": "Standard ¹H shift ~7.34 ppm (CDCl3).",
        "license": "CC-BY-4.0 packaging; values from cited table"
      },
      "peaks": [
        { "delta_ppm": 7.34, "multiplicity": "s", "integration": 6, "j_hz": [] }
      ]
    },
    {
      "id": "benzene-13c",
      "nucleus": "13C",
      "solvent": "CDCl3",
      "peaks": [
        { "delta_ppm": 128.4, "multiplicity": "s", "integration": 6 }
      ]
    }
  ]
}
```

### Render modes (UI)

- **Field selector:** 60 MHz | 500 MHz (and later custom).
- **X-axis:** ppm (default) or Hz relative to a reference frequency.
- **Line shape:** δ → frequency axis; width ≈ max(digital resolution, 1/T₂ teaching width, J-structure).
- **Multiplets:** first-order only in v1 (n+1 rule); second-order flagged as “advanced / schematic”.

## Build pipeline (when implemented)

1. `data/nmr-seeds/*.json` → validate (nucleus enum, δ range, solvent, source note).
2. Merge onto compounds in `tools/build-dataset.mjs` as `technique: "nmr_1h" | "nmr_13c"`.
3. Precompute optional `display_points` at 60 and 500 MHz **or** compute in the client from peaks (prefer client for field switch).
4. Index flags: `has_nmr_1h`, `has_nmr_13c`.
5. Explorer: new tabs **¹H NMR** / **¹³C NMR** next to UV / IR / Raman.

## Local package mode

- Ship peak lists + structures inside the package.
- No live nmrshiftdb2 / PubChem dependency at runtime.
- Import from open databases **only at build time**, with license gate.

## Suggested pilot set (lab set first)

Benzene, toluene, acetone, ethanol, phenol, aniline, benzaldehyde, acetophenone, naphthalene, anthracene, caffeine, ibuprofen, aspirin, tryptophan, adenine — textbook ¹H/¹³C tables are easy to cite.

## Out of scope for first NMR ship

- Full FID processing (phase, baseline) — use [NMRium](https://www.nmrium.org/) patterns later if needed  
- Automated scrape of SDBS/NIST  
- Claiming 60 MHz “looks exactly like your department’s old instrument” without experimental overlays  
