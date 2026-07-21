import type { Compound, DatasetIndex, IndexCompound, Spectrum, TechniqueTab } from '../types'
import { indexHasFullUvVis } from '../types'
import { isSearchableCompound } from './search'
import type MiniSearch from 'minisearch'

export type ExplorerMode = 'simple' | 'advanced'

export const RESULT_CAP = 12

export const FALLBACK_META = {
  default_compound_id: 'rhodamine-b',
  lab: {
    compound_id: 'benzene',
    technique: 'uvvis' as TechniqueTab,
    lab_set_only: true,
    mode: 'simple' as ExplorerMode,
  },
  lab_classes: [
    { id: 'dyes', label: 'UV dyes' },
    { id: 'solvents', label: 'Solvents' },
    { id: 'aromatics', label: 'Aromatics' },
    { id: 'porphyrins', label: 'Porphyrins' },
    { id: 'biomolecules', label: 'Biomolecules' },
  ],
}

export function qualityLabel(s: Spectrum | null | undefined): string {
  if (!s) return ''
  if (s.quality === 'experimental' && s.example_not_for_citation) return 'Schema example'
  if (s.quality === 'experimental') return 'Experimental'
  return 'Teaching envelope'
}

export function spectrumForTab(c: Compound | null, tab: TechniqueTab): Spectrum | null {
  if (!c) return null
  if (tab === 'uvvis') return c.spectra.find((s) => s.technique === 'uvvis_abs') ?? null
  if (tab === 'ir') return c.spectra.find((s) => s.technique === 'ir') ?? null
  return c.spectra.find((s) => s.technique === 'raman') ?? null
}

export function resolveDefaultId(
  data: DatasetIndex,
  preferred: string | null | undefined,
  labOnly: boolean,
): string | null {
  const meta = data.app_meta ?? FALLBACK_META
  const tryId = preferred || meta.default_compound_id
  const pool = labOnly ? data.compounds.filter((c) => c.lab_set) : data.compounds
  const hit =
    pool.find((c) => c.id === tryId) ||
    pool.find((c) => c.id === meta.lab?.compound_id) ||
    pool.find((c) => indexHasFullUvVis(c)) ||
    pool[0] ||
    data.compounds.find((c) => indexHasFullUvVis(c)) ||
    data.compounds[0]
  return hit?.id ?? null
}

export function sleep(ms: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms)
  })
}

export type SearchFilterOpts = {
  query: string
  uvOnly: boolean
  experimentalOnly: boolean
  labSetOnly: boolean
  labClass: string | null
  resultCap: number
}

/** Filter + search the index; schema demos stay out of browse. */
export function filterSearchResults(
  compounds: IndexCompound[],
  searcher: MiniSearch<IndexCompound> | null,
  opts: SearchFilterOpts,
): IndexCompound[] {
  if (!searcher) return []
  const q = opts.query.trim()
  let pool = compounds.filter(isSearchableCompound)
  if (opts.labSetOnly) pool = pool.filter((c) => c.lab_set)
  if (opts.labClass) {
    pool = pool.filter((c) => (c.lab_classes || []).includes(opts.labClass!))
  }
  if (opts.uvOnly) pool = pool.filter((c) => indexHasFullUvVis(c))
  if (opts.experimentalOnly) {
    pool = pool.filter((c) => c.has_experimental && !c.has_experimental_example)
  }
  if (!q) {
    if (opts.labSetOnly || opts.labClass || opts.uvOnly || opts.experimentalOnly) {
      return pool.slice(0, opts.resultCap)
    }
    return []
  }
  const hits = searcher.search(q)
  const byId = new Map(pool.map((c) => [c.id, c]))
  return hits
    .map((h) => byId.get(h.id))
    .filter((c): c is IndexCompound => Boolean(c))
    .slice(0, opts.resultCap)
}

export function emptySearchMessage(opts: {
  experimentalOnly: boolean
  labSetOnly: boolean
  labClass: string | null
  uvOnly: boolean
}): string {
  if (opts.experimentalOnly) {
    return 'No real experimental series yet — teaching envelopes only until open data is contributed'
  }
  if (opts.labSetOnly || opts.labClass) return 'No lab-set matches'
  if (opts.uvOnly) return 'No full UV–Vis curves match'
  return 'No matches'
}
