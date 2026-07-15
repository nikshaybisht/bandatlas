# Contributing

Thanks for considering a contribution. BandAtlas is intentionally **small and static** so others can audit the data and rebuild the client offline. You do **not** need to read the entire codebase to add a UV teaching seed or file a bug.

| Start here | Link |
|------------|------|
| Add a UV teaching curve (~15 min) | [docs/ADD_SPECTRUM.md](docs/ADD_SPECTRUM.md) |
| How data flows (1–2 pages) | [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) |
| Teaching vs experimental rules | [docs/methodology.md](docs/methodology.md) |
| Good first issues | [label: good first issue](https://github.com/nikshaybisht/bandatlas/labels/good%20first%20issue) |
| Live demo | https://nikshaybisht.github.io/bandatlas/ |

## Ground rules

1. **Label data honestly.** Teaching envelopes must not be presented as experimental digitizations.
2. **Cite sources.** Every spectrum needs a `source.citation` (and DOI/URL when available). Experimental overlays require redistribution rights.
3. **Keep the client fast.** Do not put full high-resolution series in the search index; the build downsamples display points.
4. **Prefer additive PRs.** One concern per pull request (data vs UI vs docs).
5. **Do not invent experimental SI.** No scraped copyrighted digitizations without clear rights.

## Development

```bash
git clone https://github.com/nikshaybisht/bandatlas.git
cd bandatlas
npm ci
npm run dataset
npm run dev
```

### Required check before a PR

```bash
npm run ci
```

That runs:

1. `validate:seeds` — UV seed schema  
2. `dataset` — rebuild + **dataset schema validation** (fails on bad flags/records)  
3. Unit tests (Node)  
4. Typecheck + production Vite build  

Optional:

```bash
npm run validate:dataset   # schema only, after dataset exists
npm run test:e2e           # Playwright (needs prior build; PubChem blocked)
npm run structures         # fetch-and-vendor SDF cache (maintainers; network)
```

## Adding a UV–Vis teaching curve (~15 min)

**→ Full guide: [docs/ADD_SPECTRUM.md](docs/ADD_SPECTRUM.md)**

Short path:

1. Copy `data/uv-seeds/_template.json` → `data/uv-seeds/<id>.json` (no leading `_` on the new file).
2. Fill **name**, **CID or SMILES**, **λ_max**, **solvent**, **source note** (`abs.lit` / `abs.quality_note`), peaks.
3. Run:

   ```bash
   npm run validate:seeds
   npm run dataset
   npm run ci
   ```

   Bad seeds **fail the build** with a clear error list.

4. Spot-check in `npm run dev` (search your id → UV–Vis → **Teaching envelope** badge).
5. Open a PR (one compound or a small batch).

Issue template: **UV teaching curve**. You can also append to the `FULL` array in `tools/build-dataset.mjs` (same schema).

## Catalog stubs / IR–Raman only

1. Edit `tools/ir-raman-lib.mjs` or the `STUBS` list in `tools/build-dataset.mjs`.
2. Run `npm run dataset` and `npm run ci`.

## Experimental spectra

If you have **clear redistribution rights** to a digitised series:

1. Add `data/experimental/<id>.json` with `quality: "experimental"`, solvent, citation, DOI or URL, and `display_points` (see `data/experimental/README.md` and [docs/methodology.md](docs/methodology.md)).
2. Run `npm run dataset` and confirm the UI badge is **Experimental** (not Teaching).
3. **Never** set `quality: "experimental"` on multi-Gaussian teaching envelopes.

Schema tooling demo: `schema-example.json` uses `example_not_for_citation: true` and must not be cited as data.

## Code style

- TypeScript, functional React components.
- No unnecessary dependencies.
- Prefer laboratory wording over marketing copy.

## Accessibility & mobile

After UI changes, use [docs/A11Y_MOBILE_CHECKLIST.md](docs/A11Y_MOBILE_CHECKLIST.md) (375px, keyboard Esc/focus, light contrast, reduce motion).

## Reporting issues

Use the GitHub issue templates:

| Template | When |
|----------|------|
| **Bug report** | UI, export, offline, or CI failure |
| **Data request** | Want a compound covered (no seed yet) |
| **UV teaching curve** | Propose λ_max + solvent for a teaching envelope |

Include: compound id, technique tab, browser, and whether the failure is data or UI.

## License

MIT — see [LICENSE](LICENSE). Authors: [AUTHORS](AUTHORS).
