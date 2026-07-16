# Security

Static frontend, no backend of its own.

If you find XSS or something nasty in this repo’s code: **don’t open a public issue**. Use GitHub Security Advisories on the repo, or message [@nikshaybisht](https://github.com/nikshaybisht).

Spectral data accuracy is not a security bug — file a normal issue.

## Hardening notes (v1.1.1+)

- Spectrum / reference links must be **http(s)** only — validated at dataset build (`tools/safe-url.mjs`) and filtered in the UI (`src/lib/safeUrl.ts`).
- Do not put `javascript:`, `data:`, or credentialed URLs in seed or experimental JSON.
- Prefer DOIs of the form `10.xxxx/suffix` for experimental sources.
- Schema demos (`example_not_for_citation`) are hidden from search; deep links still work for testing.
