# Mass spectrometry (MS / HRMS / MALDI-TOF)

Status: **v1 teaching pilot** — explorer **MS** tab, local seeds in `data/ms-seeds/`.

## Why this exists

Literature surveys often show **disagreement** between papers on IR λ, NMR δ, UV λ_max, and especially **MS fragment intensities** (and sometimes m/z assignments). BandAtlas does **not** pretend to be a multi-paper voting system. Teaching MS lists are **consolidated schematic** peak tables for learning fragmentation patterns. For research, compare 2–3 primary papers yourself — that skill is the point.

## Methods

| `method` | UI label | Notes |
|----------|----------|--------|
| `ei` | EI-MS | Classic 70 eV electron ionization teaching sticks |
| `esi` | ESI-MS | Soft ionization — often [M+H]⁺ / [M−H]⁻ |
| `hrms` | HRMS | Same stick idea with exact-mass caption; not full isotope envelope SI |
| `maldi_tof` | MALDI-TOF | Soft ionization + matrix note; schematic for small molecules |

One compound can ship **multiple** method blocks under `spectra[]`.

## Seed shape

See `data/ms-seeds/_template.json`. Peaks: `{ mz, intensity, formula?, label? }` with intensity relative (base = 100).

## Honesty

- `quality: teaching` — multiplet/stick teaching model  
- Never relabel as experimental without rights-cleared digitization + DOI/URL  
- Source notes should mention literature variance when relevant  

## Runtime

- Technique id: `ms`  
- Deep link: `?tech=ms` or `?tech=ms&ms=ei`  
- Method toggle when several methods exist  
