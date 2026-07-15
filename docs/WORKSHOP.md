# Workshop outline (≈ 2 hours)

Static free app — **no accounts, payments, or license keys.**  
**Live:** https://nikshaybisht.github.io/bandatlas/  
**Pin a release** for reproducible workshops (recommended).

## Before the session

1. Open the [latest release](https://github.com/nikshaybisht/bandatlas/releases) and note the tag (e.g. `v1.1.0`).
2. Prefer the **GitHub Pages** build for that tag once deployed, or clone the tag:

   ```bash
   git clone --branch v1.1.0 https://github.com/nikshaybisht/bandatlas.git
   cd bandatlas && npm ci && npm run dataset && npm run preview
   ```

3. Print or share [docs/course/WORKSHEET.md](course/WORKSHEET.md).
4. Skim [docs/course/Top50.md](course/Top50.md) for compound ids.
5. Optional: [docs/DEMO_SCRIPT.md](DEMO_SCRIPT.md) for a 60s opener.

## Agenda

| Time | Block | Activity |
|------|--------|----------|
| 0:00–0:10 | **Hook** | Live demo: search Rhodamine B, UV + emission, honesty banner |
| 0:10–0:25 | **Lecture** | Conjugation, λ_max, color; use Top50 “Color & conjugation” set |
| 0:25–0:40 | **Hands-on 1** | Worksheet Q1 (β-carotene vs benzene) |
| 0:40–0:55 | **IR** | Group frequencies; acetone IR; switch tabs |
| 0:55–1:10 | **Hands-on 2** | Worksheet Q2 |
| 1:10–1:25 | **Data honesty** | Teaching vs experimental; export Lab Note Pack headers |
| 1:25–1:40 | **Hands-on 3** | Worksheet Q3 + Lab companion `/lab` |
| 1:40–1:50 | **Share links** | Students exchange `/c/<id>?tech=` links |
| 1:50–2:00 | **Close** | Limitations, cite primary literature, good first issues optional |

## Learning outcomes

By the end, participants can:

1. Find a compound and switch UV–Vis / IR / Raman.
2. Relate conjugation and λ_max to perceived color (qualitatively).
3. Use IR peak markers as teaching prompts for functional groups.
4. State that BandAtlas teaching curves are **not** experimental SI.
5. Export a note pack / CSV that preserves the disclaimer.

## Room setup

- Browser + projector; optional student laptops.
- Offline-friendly: lab-set 3D uses cached SDF; spectra are static JSON.
- Block PubChem intentionally to demo offline structure cache if useful.

## Instructor pack index

| Resource | Path |
|----------|------|
| In-app instructors page | `/instructors` on live site |
| Top 50 ids | [docs/course/Top50.md](course/Top50.md) |
| Worksheet | [docs/course/WORKSHEET.md](course/WORKSHEET.md) |
| Architecture | [docs/ARCHITECTURE.md](ARCHITECTURE.md) |
| Add a UV seed | [docs/ADD_SPECTRUM.md](ADD_SPECTRUM.md) |

## After the workshop

- Collect feedback; file data requests via GitHub issue templates.
- Do **not** ask students to invent experimental digitizations.
