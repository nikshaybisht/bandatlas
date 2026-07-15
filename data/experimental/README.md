# Experimental spectral series

Drop open-redistributable instrument series here as `*.json` files (not starting with `_`).  
They are merged by `npm run dataset` into `public/dataset/compounds/`.

## Required shape

```json
{
  "compound_id": "benzene",
  "spectrum": {
    "technique": "uvvis_abs",
    "quality": "experimental",
    "solvent": "cyclohexane",
    "temperature_K": 298,
    "y_unit": "normalized",
    "y_unit_label": "Relative absorbance",
    "lambda_max_nm": [254],
    "plain_caption": "…",
    "display_points": [[220, 0.1], [254, 1.0]],
    "source": {
      "citation": "Author, Title, Journal year…",
      "doi": "10.…",
      "url": "https://…",
      "license": "CC-BY-4.0",
      "note": "experimental digitization"
    }
  }
}
```

For a **new** compound not already in the catalog, set `"create_if_missing": true` and include a full `compound` object (name, formula, cas, family, pubchem_cid, …).

## Forbidden

- Relabeling teaching multi-Gaussian envelopes as `quality: "experimental"`
- Copyrighted digitizations without redistribution rights
- Missing citation + (DOI or URL)
- Claiming NIST / vendor scans unless the license clearly allows redistribution

## Schema demo

`schema-example.json` ships a **synthetic** experimental-flagged series with  
`example_not_for_citation: true`. It is **not** measured data.
