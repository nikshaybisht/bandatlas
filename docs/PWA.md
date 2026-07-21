# PWA status

BandAtlas ships a **manifest-only “PWA-lite”** setup:

- `public/manifest.webmanifest` (name, icons, theme)
- No service worker
- No offline shell caching beyond whatever the browser already has for static assets

## Why

The app is a static Vite build on GitHub Pages. A service worker would need careful cache invalidation for `public/dataset/` (regenerated on every deploy). Until that is intentional, install/add-to-home-screen may work via the manifest, but **offline use is not guaranteed**.

## When to add a real SW

Only if we need:

1. Offline explorer for the lab set, and
2. Explicit cache versioning tied to `summary.json` / app version.

Until then, keep this document as the decision record.
