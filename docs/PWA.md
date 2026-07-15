# PWA-lite notes

BandAtlas ships a **web app manifest** (`public/manifest.webmanifest`) and icons so browsers can “install” or pin the app. `start_url` / `scope` are relative (`./`) so they resolve correctly under the GitHub Pages base `/bandatlas/`.

## Service worker

**Not used (intentionally).**

A service worker that caches the shell and dataset would need careful base-path handling (`/bandatlas/`), cache invalidation on each release, and offline compound-JSON coverage. Misconfiguration is a common source of “stuck on old build” bugs on project Pages sites.

Until there is a dedicated offline QA path:

- Do **not** register a service worker in `index.html` or `main.tsx`
- Prefer the static Pages deploy as-is
- Offline-friendly pieces already ship without SW: local SDF structure cache, static `public/dataset/**`

If a SW is added later: use Workbox/`vite-plugin-pwa` with `base` matching `VITE_BASE`, versioned precache, and a hard skip-waiting policy for deploys.
