import MiniSearch from 'minisearch'
import type { IndexCompound } from '../types'

/** Schema demos stay loadable via direct /c/:id but not in casual search. */
export function isSearchableCompound(c: IndexCompound): boolean {
  return !c.has_experimental_example
}

export function buildSearchIndex(compounds: IndexCompound[]) {
  const ms = new MiniSearch<IndexCompound>({
    fields: ['name', 'synonyms', 'cas', 'formula', 'smiles', 'family_label', 'id'],
    storeFields: [
      'id',
      'name',
      'family',
      'family_label',
      'cas',
      'formula',
      'mw',
      'tier',
      'has_uvvis',
      'has_fluorescence',
      'has_experimental',
      'has_experimental_example',
      'lambda_max_nm',
      'pubchem_cid',
    ],
    searchOptions: {
      boost: { name: 4, cas: 3, formula: 2, synonyms: 2 },
      prefix: true,
      fuzzy: 0.15,
    },
    extractField: (doc, field) => {
      if (field === 'synonyms') return (doc.synonyms || []).join(' ')
      const value = doc[field as keyof IndexCompound]
      return String(value ?? '')
    },
  })
  // Exclude schema-example compounds from the index so they never appear in hits
  ms.addAll(compounds.filter(isSearchableCompound))
  return ms
}
