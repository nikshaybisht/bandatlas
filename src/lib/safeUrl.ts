/**
 * Harden user/dataset-controlled link targets (XSS / javascript: schemes).
 * Only http(s) absolute URLs are allowed for href.
 */

export function safeHttpUrl(raw: string | null | undefined): string | null {
  if (raw == null) return null
  const s = String(raw).trim()
  if (!s) return null
  // Block obvious dangerous schemes before URL parse
  if (/^(javascript|data|vbscript|file):/i.test(s)) return null
  try {
    const u = new URL(s)
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return null
    // Reject credentials-in-URL tricks
    if (u.username || u.password) return null
    return u.href
  } catch {
    return null
  }
}

/** Crossref-style DOI → https://doi.org/... or null if shape is wrong. */
export function safeDoiUrl(doi: string | null | undefined): string | null {
  if (doi == null) return null
  let d = String(doi).trim()
  if (!d) return null
  // Strip accidental full URL prefix
  d = d.replace(/^https?:\/\/(dx\.)?doi\.org\//i, '')
  // Basic DOI shape: 10.xxxx/suffix
  if (!/^10\.\d{4,9}\/\S+$/i.test(d)) return null
  if (/[<>"'`]/.test(d)) return null
  return `https://doi.org/${encodeURI(d)}`
}

/** Legacy name used by CitationsPanel — prefer safeDoiUrl. */
export function doiUrl(doi: string): string {
  return safeDoiUrl(doi) || `https://doi.org/${encodeURIComponent(doi.trim())}`
}
