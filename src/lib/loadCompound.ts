import type { Compound } from '../types'
import { datasetUrl } from './paths'

const cache = new Map<string, Compound>()

export async function loadCompound(id: string): Promise<Compound> {
  const hit = cache.get(id)
  if (hit) return hit
  const res = await fetch(datasetUrl(`compounds/${encodeURIComponent(id)}.json`))
  if (!res.ok) throw new Error(`Failed to load compound ${id}`)
  const data = (await res.json()) as Compound
  cache.set(id, data)
  return data
}

export function pubchemSdfUrl(cid: number) {
  return `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${cid}/SDF?record_type=3d`
}

export function pubchemSdf2dUrl(cid: number) {
  return `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${cid}/SDF`
}
