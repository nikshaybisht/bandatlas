import { datasetUrl } from './paths'

export interface Reference {
  id: string
  type: string
  authors: string
  title: string
  journal?: string
  year: number
  volume?: string
  pages?: string
  doi?: string
  url?: string
  edition?: string
  publisher?: string
  note?: string
}

let cache: Reference[] | null = null

export async function loadReferences(): Promise<Reference[]> {
  if (cache) return cache
  const res = await fetch(datasetUrl('references.json'))
  if (!res.ok) return []
  const data = (await res.json()) as { references: Reference[] }
  cache = data.references
  return cache
}

export function formatCitation(r: Reference): string {
  const parts = [`${r.authors} (${r.year}). ${r.title}.`]
  if (r.journal) {
    parts.push(`*${r.journal}*`)
    if (r.volume) parts.push(r.volume)
    if (r.pages) parts.push(r.pages)
  }
  if (r.publisher) parts.push(r.publisher)
  if (r.edition) parts.push(`${r.edition} ed.`)
  return parts.filter(Boolean).join(' ')
}
