/**
 * Shared URL/DOI allowlist for dataset validation (Node).
 * Keep in sync with src/lib/safeUrl.ts
 */

/**
 * @param {unknown} raw
 * @returns {string|null}
 */
export function safeHttpUrl(raw) {
  if (raw == null) return null
  const s = String(raw).trim()
  if (!s) return null
  if (/^(javascript|data|vbscript|file):/i.test(s)) return null
  try {
    const u = new URL(s)
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return null
    if (u.username || u.password) return null
    return u.href
  } catch {
    return null
  }
}

/**
 * @param {unknown} doi
 * @returns {string|null}
 */
export function safeDoiUrl(doi) {
  if (doi == null) return null
  let d = String(doi).trim()
  if (!d) return null
  d = d.replace(/^https?:\/\/(dx\.)?doi\.org\//i, '')
  if (!/^10\.\d{4,9}\/\S+$/i.test(d)) return null
  if (/[<>"'`]/.test(d)) return null
  return `https://doi.org/${encodeURI(d)}`
}
