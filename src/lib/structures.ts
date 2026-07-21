import { assetUrl } from './paths'

const PUBCHEM_TIMEOUT_MS = 8_000

export function localStructureUrl(pubchemCid: number): string {
  return assetUrl(`structures/${pubchemCid}.sdf`)
}

// older deploys still look under dataset/structures/
export function localStructureUrlLegacy(pubchemCid: number): string {
  return assetUrl(`dataset/structures/${pubchemCid}.sdf`)
}

export function pubchemSdf3dUrl(cid: number) {
  return `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${cid}/SDF?record_type=3d`
}

export function pubchemSdf2dUrl(cid: number) {
  return `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${cid}/SDF`
}

export function looksLikeSdf(text: string): boolean {
  if (!text || text.length < 40) return false
  if (/Status:\s*40[04]/i.test(text)) return false
  if (/<\s*html/i.test(text)) return false
  return /V2000|V3000|M\s+END/i.test(text)
}

export type StructureSource = 'local' | 'pubchem-3d' | 'pubchem-2d'

async function fetchText(
  url: string,
  opts: { timeoutMs?: number; retries?: number } = {},
): Promise<{ ok: boolean; status: number; text: string }> {
  const timeoutMs = opts.timeoutMs ?? PUBCHEM_TIMEOUT_MS
  const retries = opts.retries ?? 0
  let lastStatus = 0
  for (let attempt = 0; attempt <= retries; attempt++) {
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), timeoutMs)
    try {
      const r = await fetch(url, { signal: ctrl.signal })
      lastStatus = r.status
      if (r.ok) {
        const text = await r.text()
        clearTimeout(timer)
        return { ok: true, status: r.status, text }
      }
      // Retry once on 5xx / 429
      if (attempt < retries && (r.status >= 500 || r.status === 429)) {
        clearTimeout(timer)
        await new Promise((res) => setTimeout(res, 400 * (attempt + 1)))
        continue
      }
      clearTimeout(timer)
      return { ok: false, status: r.status, text: '' }
    } catch {
      clearTimeout(timer)
      if (attempt < retries) {
        await new Promise((res) => setTimeout(res, 400 * (attempt + 1)))
        continue
      }
      return { ok: false, status: lastStatus || 0, text: '' }
    }
  }
  return { ok: false, status: lastStatus, text: '' }
}

async function tryLocal(url: string): Promise<string | null> {
  try {
    const r = await fetch(url)
    if (!r.ok) return null
    const text = await r.text()
    return looksLikeSdf(text) ? text : null
  } catch {
    return null
  }
}

// local cache → PubChem 3D → 2D. Callers should isolate errors so search/spectrum keep working.
export async function loadStructureSdf(pubchemCid: number): Promise<{
  sdf: string
  source: StructureSource
}> {
  const local =
    (await tryLocal(localStructureUrl(pubchemCid))) ||
    (await tryLocal(localStructureUrlLegacy(pubchemCid)))
  if (local) return { sdf: local, source: 'local' }

  const r3 = await fetchText(pubchemSdf3dUrl(pubchemCid), {
    timeoutMs: PUBCHEM_TIMEOUT_MS,
    retries: 1,
  })
  if (r3.ok && looksLikeSdf(r3.text)) {
    return { sdf: r3.text, source: 'pubchem-3d' }
  }

  const r2 = await fetchText(pubchemSdf2dUrl(pubchemCid), {
    timeoutMs: PUBCHEM_TIMEOUT_MS,
    retries: 1,
  })
  if (r2.ok && looksLikeSdf(r2.text)) {
    return { sdf: r2.text, source: 'pubchem-2d' }
  }

  throw new Error(
    r2.status || r3.status
      ? `PubChem unavailable (HTTP ${r2.status || r3.status})`
      : 'PubChem timeout / network error',
  )
}
