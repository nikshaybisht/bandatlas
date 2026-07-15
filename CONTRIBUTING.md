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
npm run ci          # validate seeds + unit tests + build
npm run validate:seeds
```

## Adding a UV–Vis teaching curve (~15 min)

**→ Full guide: [docs/ADD_SPECTRUM.md](docs/ADD_SPECTRUM.md)**

Short path:

1. Copy `data/uv-seeds/_template.json` → `data/uv-seeds/<id>.json` (do not keep the `_` prefix).
2. Fill **name**, **CID or SMILES**, **λ_max**, **solvent**, **source note** (`abs.lit` / `abs.quality_note`), peaks.
3. Run:

   ```bash
   npm run validate:seeds
   npm run dataset
   ```

   Bad seeds **fail the build** with a clear error list.

4. Spot-check in `npm run dev`, then open a PR.

You can also append to the `FULL` array in `tools/build-dataset.mjs` (same schema).

Issue template: **Request / add UV teaching curve** (GitHub Issues).

## Catalog stubs / IR–Raman only

1. Edit `tools/ir-raman-lib.mjs` or the `STUBS` list in `tools/build-dataset.mjs`.
2. Run `npm run dataset`.

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

## Accessibility & mobile

After UI changes, run the short checklist: [docs/A11Y_MOBILE_CHECKLIST.md](docs/A11Y_MOBILE_CHECKLIST.md) (375px layout, keyboard Esc/focus, light contrast, reduce motion).

## Reporting issues

Include: compound id, technique tab, browser, and whether the failure is data or UI.
