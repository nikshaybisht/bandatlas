# Contributing

Keep it small and honest.

- Teaching envelopes stay labeled `teaching`. Never call them experimental.
- Cite sources on every spectrum. Experimental files need redistribution rights + DOI/URL.
- One concern per PR when you can (data vs UI vs docs).
- Before opening a PR, ensure `npm run ci` passes.

## Add a UV teaching curve

Full path: [docs/ADD_SPECTRUM.md](docs/ADD_SPECTRUM.md).

Copy `data/uv-seeds/_template.json` to `data/uv-seeds/<id>.json`, fill identity + λ_max peaks + literature note, then rebuild with the project’s dataset scripts. The UI badge must say **Teaching envelope**.

All full-UV teaching compounds live under `data/uv-seeds/` (not in the build script).

## Experimental series

Only if you can redistribute the digitization. Put JSON under `data/experimental/` — see that folder’s README and [docs/methodology.md](docs/methodology.md). External databases and license notes: [docs/DATA_SOURCES.md](docs/DATA_SOURCES.md).

## NMR (planned)

Templates under `data/nmr-seeds/` and design notes in [docs/NMR_PLAN.md](docs/NMR_PLAN.md). Do not open PRs that scrape SDBS/NIST/SpectraBase.

## Local dev

Install dependencies, build the dataset, start the Vite dev server (see README “Run it”).
