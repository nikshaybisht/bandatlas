# Contributing

Keep it small and honest.

- Teaching envelopes stay labeled `teaching`. Never call them experimental.
- Cite sources on every spectrum. Experimental files need redistribution rights + DOI or URL.
- One concern per pull request when you can (data vs UI vs docs).
- Before a pull request, make sure the project’s full check still passes (see the README “Run it” / CI section).

## Add a UV teaching curve

See [docs/ADD_SPECTRUM.md](docs/ADD_SPECTRUM.md).

Copy `data/uv-seeds/_template.json` to a new file named for the compound id under `data/uv-seeds/`, fill identity, λ_max peaks, and a literature source note. After the dataset is rebuilt, the UI badge must say **Teaching envelope**.

All full-UV teaching compounds live under `data/uv-seeds/` (not in the build script).

## NMR and MS teaching seeds

- **¹H / ¹³C:** `data/nmr-seeds/` — [docs/NMR_PLAN.md](docs/NMR_PLAN.md)
- **MS (EI / ESI / HRMS / MALDI):** `data/ms-seeds/` — [docs/MS_PLAN.md](docs/MS_PLAN.md)

Do not open pull requests that scrape SDBS, NIST WebBook, or SpectraBase.

## Experimental series

Only if you can redistribute the digitization. Put JSON under `data/experimental/` — see that folder’s README and [docs/methodology.md](docs/methodology.md). External databases and license notes: [docs/DATA_SOURCES.md](docs/DATA_SOURCES.md).

## Local development

Install dependencies, build the dataset, and start the dev server as described in the README (“Run it”). Day-to-day scripts are listed there — this file is for contribution policy, not a command cheat sheet.
