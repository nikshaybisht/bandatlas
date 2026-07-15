# 60-second spoken demo script

**Audience:** PhD panel, internship interview, or portfolio walkthrough.  
**Live:** https://nikshaybisht.github.io/bandatlas/  
**Guide:** https://nikshaybisht.github.io/bandatlas/guide  
**In-app:** click **Run 60s tour** (nav, Guide, or About).

---

## Script (~60 seconds)

> “BandAtlas is a static web app I built for **lab discussion and teaching** — UV–Vis, IR, and Raman for common small molecules, with structures and export, fully client-side on GitHub Pages.
>
> In the first few seconds you **search** by name or CAS — here I’m on **Rhodamine B**, a dye everyone recognizes. The UV–Vis curve is a **teaching envelope**: honest multi-Gaussian shape tied to literature λ_max, not a fake NIST dump. Quality is labeled on every spectrum.
>
> Same compound, I switch to **IR** — group-frequency teaching bands for a pre-lab discussion. There’s also Raman for the full set.
>
> Under **Export**, you get CSV and JSON with quality headers, or on Lab companion a full **note pack** for a lab notebook. Filters like **Has full UV–Vis** cut the catalog to compounds that actually have a full curve — about a hundred of nearly five hundred searchable entries.
>
> Stack-wise: **React, TypeScript, Vite**, a Node **dataset pipeline**, unit tests plus Playwright, CI, and Pages deploy with a proper base path. No backend. Built solo so the product decisions and the engineering are both mine.”

---

## Click path (if not using auto-tour)

1. Open https://nikshaybisht.github.io/bandatlas/  
2. Optional: **Run 60s tour**  
3. Or manually: Featured chip **Rhodamine B** → UV tab → IR tab → open **Export** → enable **Has full UV–Vis**  
4. Optional close: `/lab` discussion card → Copy link  

---

## One-liner (elevator, ~10 s)

> “I shipped BandAtlas — a React/TS teaching spectral atlas with an honest quality model, a lab note export path, and full CI + GitHub Pages — so students and peers can open a compound and discuss UV/IR in one link.”
