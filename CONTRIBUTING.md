# Contributing

Keep it small and honest.

- Teaching envelopes stay labeled `teaching`. Never call them experimental.
- Cite sources on every spectrum. Experimental files need redistribution rights + DOI/URL.
- One concern per PR when you can (data vs UI vs docs).
- Before PR: `npm run ci`

## Add a UV teaching curve

See [docs/ADD_SPECTRUM.md](docs/ADD_SPECTRUM.md). Short version:

1. Copy `data/uv-seeds/_template.json` → `data/uv-seeds/<id>.json`
2. Fill name, CID/SMILES, λ_max, solvent, peaks, source note
3. `npm run validate:seeds && npm run dataset && npm run ci`
4. Check in the UI that the badge says teaching envelope

## Experimental series

Only if you can redistribute the digitization. Put JSON under `data/experimental/` — see that folder’s README and [docs/methodology.md](docs/methodology.md).

## Dev

```bash
npm ci
npm run dataset
npm run dev
```
