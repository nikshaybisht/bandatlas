# Contributing

Thanks for considering a contribution. BandAtlas is intentionally small and static so that others can audit the data and rebuild the client offline.

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

## Experimental spectra

If you have **clear redistribution rights** to a digitised series:

1. Add `data/experimental/<id>.json` with `quality: "experimental"`, solvent, citation, DOI or URL, and `display_points` (see `data/experimental/README.md` and [docs/methodology.md](docs/methodology.md)).
2. Run `npm run dataset` and confirm the UI badge is **Experimental** (not Teaching).
3. **Never** set `quality: "experimental"` on multi-Gaussian teaching envelopes.

Schema tooling demo: `schema-example.json` uses `example_not_for_citation: true` and must not be cited as data.

## Code style

- TypeScript, functional React components.
- No unnecessary dependencies.
- Avoid chatty UI copy; prefer laboratory wording.

## Reporting issues

Include: compound id, technique tab, browser, and whether the failure is data or UI.
