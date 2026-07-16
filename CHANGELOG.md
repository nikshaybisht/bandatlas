# Changelog

## 1.1.1

Security / integrity hardening:

- Allowlist **http(s) only** for spectrum and reference links (`tools/safe-url.mjs`, `src/lib/safeUrl.ts`)
- Dataset build rejects `javascript:` / `data:` / bad DOIs on `source.url` / `source.doi`
- Citations panel only renders safe hrefs
- Plot empty state uses React nodes (no `innerHTML`)
- Schema-example compounds hidden from search browse (still via `/c/schema-example-uv`)
- Share URLs encode compound ids; `tests/safe-url.test.mjs`

## 1.1.0

Instructor page + course docs under `docs/course/`. Same app otherwise.

## 1.0.0

First release I’m comfortable linking people to.

- Explorer / lab / guide / about routes, deep links `/c/:id?tech=`
- Lab set (~35) with note pack export
- Teaching vs experimental quality tags; plot watermark on teaching curves
- Dataset build + schema checks; offline SDF cache for common CIDs
- Playwright smoke in CI; Pages deploy

Still no real open experimental digitizations in the tree. Teaching only until someone contributes rights-cleared series.

## Earlier

A pile of smaller bumps while this was named a few things and the UI settled down. Not worth replaying version-by-version here — see git history if you care.
