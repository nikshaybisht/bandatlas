export type Technique = 'uvvis_abs' | 'fluorescence' | 'ir' | 'raman'

export type TechniqueTab = 'uvvis' | 'ir' | 'raman'

export interface SpectrumSource {
  citation: string
  license?: string
  note?: string
  doi?: string
  url?: string
}

export interface Spectrum {
  id: string
  technique: Technique
  kind: string
  solvent?: string
  y_unit: 'epsilon' | 'normalized' | 'absorbance'
  y_unit_label: string
  /** UV–Vis peak wavelengths (nm) */
  lambda_max_nm?: number[]
  epsilon_max?: number[]
  /** IR / Raman peak positions (cm⁻¹) */
  peak_positions?: number[]
  peak_labels?: string[]
  quantum_yield?: number
  plain_caption: string
  display_points: [number, number][]
  source: SpectrumSource
}

export interface Compound {
  id: string
  name: string
  synonyms: string[]
  family: string
  family_label: string
  cas: string
  formula: string
  mw: number
  smiles: string
  pubchem_cid: number
  plain_summary: string
  structure: { pubchem_3d?: boolean; sdf?: string }
  spectra: Spectrum[]
  photophysics: {
    quantum_yield?: number | null
    quantum_yield_solvent?: string | null
  }
  availability: {
    uvvis_abs: boolean
    fluorescence: boolean
    ir: boolean
    raman: boolean
  }
  tier: 'full' | 'catalog' | 'partial'
}

export interface IndexCompound {
  id: string
  name: string
  synonyms: string[]
  family: string
  family_label: string
  cas: string
  formula: string
  mw: number
  smiles: string
  pubchem_cid: number
  tier: 'full' | 'catalog' | 'partial'
  has_uvvis: boolean
  has_fluorescence: boolean
  has_ir: boolean
  has_raman: boolean
  lambda_max_nm: number[]
  solvents: string[]
}

export interface DatasetIndex {
  version: string
  generated_at: string
  counts: {
    total: number
    full_spectra: number
    catalog_only: number
    with_ir?: number
    with_raman?: number
  }
  families: { id: string; label: string; count: number }[]
  compounds: IndexCompound[]
}
