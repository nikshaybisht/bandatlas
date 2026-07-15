# Contributing

Thanks for considering a contribution. Chromoscope is intentionally small and static so that others can audit the data and rebuild the client offline.

## Ground rules

1. **Label data honestly.** Teaching envelopes must not be presented as experimental digitizations.
2. **Cite sources.** Every spectrum object needs a `source.citation` (and DOI/URL when available).
3. **Keep the client fast.** Do not ship full high-resolution series in the search index; downsample display points at build time.
4. **Prefer additive PRs.** One concern per pull request (data vs UI vs docs).

## Development

```bash
npm install
npm run dataset
npm run dev
```

Build check:

```bash
npm run build
```

## Adding compounds

1. Prefer editing `tools/build-dataset.mjs` (UV–Vis seeds) or `tools/ir-raman-lib.mjs` (IR/Raman profiles, catalog stubs).
2. Run `npm run dataset`.
3. Spot-check the compound page (spectrum, provenance note, 3D).
4. Document any new literature sources in `public/dataset/references.json`.

## Experimental spectra (preferred long-term)

If you have redistribution rights to a digitised series:

- Store raw points under `data/raw/` (not necessarily in git if large; document the license).
- Convert in the build pipeline to the compound JSON schema.
- Set `source.note` to something like `experimental digitization` and include DOI/instrument/solvent/temperature.

## Code style

- TypeScript, functional React components.
- No unnecessary dependencies.
- Avoid chatty UI copy; prefer laboratory wording.

## Reporting issues

Include: compound id, technique tab, browser, and whether the failure is data or UI.
