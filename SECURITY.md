# Security policy

## Supported versions

| Version | Supported |
|---------|-----------|
| `0.4.x` (latest on `main`) | Yes |
| Older tags (`v0.1`–`v0.3`) | No — please upgrade to latest `main` / release |

BandAtlas is a static browser application (no default backend). Security issues are still taken seriously when they affect users who clone, host, or integrate the project.

## What to report

Please report vulnerabilities that could affect confidentiality, integrity, or availability of a deployment or end user, for example:

- Cross-site scripting (XSS) or HTML injection via compound data or UI
- Prototype pollution or unsafe `eval`/dynamic code paths introduced by this project’s own code
- Path traversal or unsafe file handling in build tools if run on untrusted input
- Supply-chain issues in **direct** dependencies that we can pin or patch
- Misconfiguration that would leak secrets if someone follows our docs incorrectly

## Out of scope (please do not open as security issues)

- Third-party services this app **calls at runtime** (e.g. PubChem) when the issue is entirely on their side
- Teaching / spectral data accuracy (use issues or discussions; not security)
- Denial of service from simply loading large public datasets
- Vulnerabilities only present in abandoned third-party forks

## How to report

**Do not** open a public GitHub issue for unfixed security vulnerabilities.

Preferred options (use either):

1. **GitHub Security Advisories** (recommended)  
   Repository → **Security** → **Report a vulnerability**  
   (or: [Advisories for this repo](https://github.com/nikshaybisht/bandatlas/security/advisories/new) once enabled)

2. **Private contact**  
   Open a **private** security advisory, or contact the maintainer via GitHub:  
   [@nikshaybisht](https://github.com/nikshaybisht)

Please include:

- Affected version or commit hash  
- Description of the issue and impact  
- Steps to reproduce (PoC)  
- Suggested fix, if you have one  

## Response expectations

- **Acknowledgement:** within 7 days when possible  
- **Triage:** severity and fix plan after we can reproduce  
- **Disclosure:** coordinated; we prefer not to publish details until a fix is released or a clear mitigation is documented  

We will credit reporters who wish to be named (unless you prefer to remain anonymous).

## Hardening notes for deployers

- Host the `dist/` output over **HTTPS** only.  
- Treat compound JSON / user-contributed spectral data as **untrusted** if you ever accept uploads.  
- Keep Node/npm dependencies updated (`npm audit` as part of routine maintenance).  
- The 3D viewer dependency (`3dmol`) and other third-party packages may ship their own advisories—track upstream releases.  
- Do not embed API keys in the static client; BandAtlas is designed to work without secrets.

## Safe harbor

We will not pursue legal action against good-faith security research that:

- avoids privacy violations and destruction of data,  
- does not degrade availability of third-party services, and  
- follows this disclosure process.

Thank you for helping keep BandAtlas and its users safe.

— **Nikshay Bisht** ([@nikshaybisht](https://github.com/nikshaybisht))
