import type { Compound } from '../types'
import { datasetUrl } from './paths'

const cache = new Map<string, Compound>()

/** Normalize dual snake_case / camelCase fields from the dataset JSON. */
function normalizeCompound(raw: Compound): Compound {
  const pubchem_cid = raw.pubchem_cid ?? raw.pubchemCid ?? 0
  const lab_set = raw.lab_set ?? raw.labSet ?? false
  const class_labels = raw.class_labels ?? raw.classLabels ?? []
  return {
    ...raw,
    pubchem_cid,
    pubchemCid: pubchem_cid,
    lab_set,
    labSet: lab_set,
    class_labels,
    classLabels: class_labels,
  }
}

export async function loadCompound(id: string): Promise<Compound> {
  const hit = cache.get(id)
  if (hit) return hit
  const res = await fetch(datasetUrl(`compounds/${encodeURIComponent(id)}.json`))
  if (!res.ok) throw new Error(`Failed to load compound ${id}`)
  const data = normalizeCompound((await res.json()) as Compound)
  cache.set(id, data)
  return data
}
