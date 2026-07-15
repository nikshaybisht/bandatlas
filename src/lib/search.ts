import MiniSearch from 'minisearch'
import type { IndexCompound } from '../types'

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
  ms.addAll(compounds)
  return ms
}
