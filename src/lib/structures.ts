import { assetUrl } from './paths'

/** Local cached SDF path under Vite base (committed offline demos). */
export function localStructureUrl(pubchemCid: number): string {
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

/**
 * Resolve SDF text: local cache → PubChem 3D → PubChem 2D.
 */
export async function loadStructureSdf(pubchemCid: number): Promise<{
  sdf: string
  source: StructureSource
}> {
  // 1) Local cache (offline / rate-limit safe)
  try {
    const r = await fetch(localStructureUrl(pubchemCid))
    if (r.ok) {
      const text = await r.text()
      if (looksLikeSdf(text)) return { sdf: text, source: 'local' }
    }
  } catch {
    /* try network */
  }

  // 2) PubChem 3D
  try {
    const r = await fetch(pubchemSdf3dUrl(pubchemCid))
    if (r.ok) {
      const text = await r.text()
      if (looksLikeSdf(text)) return { sdf: text, source: 'pubchem-3d' }
    }
  } catch {
    /* try 2D */
  }

  // 3) PubChem 2D
  const r2 = await fetch(pubchemSdf2dUrl(pubchemCid))
  if (!r2.ok) throw new Error(`PubChem HTTP ${r2.status}`)
  const text2 = await r2.text()
  if (!looksLikeSdf(text2)) throw new Error('No valid SDF from PubChem')
  return { sdf: text2, source: 'pubchem-2d' }
}
