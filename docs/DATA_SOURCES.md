# External spectral data sources (research notes)

BandAtlas today ships **teaching envelopes** plus an empty-but-ready path for **rights-cleared experimental** series. This page records which public websites are useful for a future upgrade, and which ones **must not** be bulk-copied without a license review.

**Policy:** never relabel a teaching multi-Gaussian as experimental. Every experimental series needs redistribution rights + citation (DOI or URL) + license note in JSON.

---

## Recommendation: keep the library local

For a future **installable package** (Electron / Tauri / offline lab image), make the library **fully local**:

| Asset | Local? | Notes |
|-------|--------|--------|
| Compound index + per-compound JSON | **Yes** | Built into `public/dataset/` at ship time |
| UV / IR / Raman / (future) NMR series | **Yes** | Teaching + any cleared experimental overlays |
| SDF structures (lab + featured) | **Yes** | `public/structures/` cache |
| PubChem live fetch | **Optional offline-off** | Fallback only when online; package mode should work with cache alone |
| Third-party spectral APIs | **No at runtime** | Import offline during build; do not depend on live sites in the lab |

Why: classroom Wi‑Fi fails, licenses are clearer when data is vendored with provenance, and a package product should not scrape the web on every open.

Network at **build time** (your machine / CI) is fine: pull allowed data → validate → commit or ship in the package. Runtime stays static files.

---

## Sources worth using (with care)

### Strong candidates for NMR (open-ish)

| Source | What you get | License / use notes | BandAtlas fit |
|--------|----------------|---------------------|---------------|
| **[nmrshiftdb2](https://nmrshiftdb.nmr.uni-koeln.de/)** | Assigned **¹H / ¹³C** (and more), peak lists, some raw data; prediction tools | Project states data under an **open content** model; software open source. Confirm license per download/export before bulk import | **Primary candidate** for experimental/teaching peak lists + field-independent δ (ppm) |
| **NMReDATA** ecosystem | Structured NMR assignments | Open formats aimed at FAIR NMR | Good interchange format for imports |
| **HMDB** (metabolites) | Some NMR among other data | Check HMDB license for redistribution | Metabolite subset only |

δ in **ppm** is field-independent; **60 MHz vs 500 MHz** mainly changes **Hz splitting** and multiplet resolution. Store chemical shifts + coupling constants once; **simulate** stick/lorentzian spectra at 60 and 500 MHz in the app.

### UV–Vis / IR / Raman

| Source | What you get | License / use notes | BandAtlas fit |
|--------|----------------|---------------------|---------------|
| **Primary literature + handbooks** (Pretsch, Socrates, PhotochemCAD-style tables) | λ_max, ε, group frequencies | Cite the book/paper; teaching envelopes already do this | **Current path** for teaching UV/IR/Raman |
| **[PubChem](https://pubchem.ncbi.nlm.nih.gov/docs/spectral-information)** Spectral Properties | Links / images / metadata from multiple sources | **Per-source** rights: PubChem page ≠ free to rehost SpectraBase or NIST images | Use as **discovery + CID**, not bulk image scrape |
| **NIST Chemistry WebBook** | IR, MS, UV/Vis collections | **Not free to redistribute as a bulk spectral library** without checking NIST terms; reserved rights | **Do not scrape into the repo.** Cite NIST when users should look there; optional deep-link only |
| **SDBS (AIST, Japan)** | IR, NMR, MS, Raman for organics | Free **viewing**; redistribution of digitizations restricted — check current AIST terms | Discovery + citation; not automatic dump |
| **SpectraBase (Wiley/Bio-Rad)** | Large commercial-backed library | Subscription / commercial; free tier limited | **No bulk reuse** |
| **UV/Vis+ Photochemistry Database** | Photochem meta / data products | Mixed free meta vs paid data licenses | Case-by-case |

### Structures (already used)

| Source | Notes |
|--------|--------|
| **PubChem** 2D/3D SDF | Fine for live fallback; **cache lab set offline** for package builds (`npm run structures`) |

---

## Forbidden / high-risk (do not “just download”)

1. **Bulk scrape** of NIST WebBook, SpectraBase, SDBS plot images, or vendor atlases.
2. Calling a multi-Gaussian teaching curve **experimental**.
3. Rehosting SpectraBase/Wiley content even if PubChem shows a thumbnail.
4. Shipping someone else’s JCAMP without an explicit redistribution license.

---

## Literature disagreement (why AI often fails here)

Masters/PhD literature surveys frequently find that **IR, NMR, UV–Vis, and MS/HRMS/MALDI** values **do not match cleanly** across 2–3 papers (solvent, instrument, calibration, relative intensity conventions, assignment errors). Generative models rarely “know” which source is right; they average or invent. BandAtlas teaching tables are **one explicit schematic** with a citation note — they are **not** a multi-paper consensus. For thesis work: open 2–3 primaries, tabulate disagreements yourself, then decide. Future experimental series must carry DOI/URL and license.

## Practical upgrade path (next milestone)

1. **Schema** — `data/nmr-seeds/` + `data/ms-seeds/` (shipped as teaching pilots) + experimental JSON (see [NMR_PLAN.md](NMR_PLAN.md), [MS_PLAN.md](MS_PLAN.md)).
2. **Import pipeline** — manual curated JSON first; later a script that only accepts files with `source.license` + DOI/URL.
3. **nmrshiftdb2 pilot** — 10–20 lab-set molecules: export peak lists if license allows; otherwise teaching shifts from textbooks with full citation.
4. **Package mode** — flag `VITE_OFFLINE=1`: no PubChem, no external images; only local SDF + dataset.
5. **Credits page** — list every external database with link + what we reused (tables vs full series).
6. Optional later: **literature variance** fields (min/max/n papers) without claiming a single “true” intensity.

---

## Cite in the product

When experimental or imported data ships:

- Spectrum `source.citation`, `source.doi` / `source.url`, `source.license`
- About / Citations panel already filters unsafe URLs
- README + `CITATION.cff` for the software; primary literature for the science numbers
