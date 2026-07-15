export type Technique = 'uvvis_abs' | 'fluorescence' | 'ir' | 'raman'

export type TechniqueTab = 'uvvis' | 'ir' | 'raman'

/** Per-spectrum data quality. Teaching envelopes must never be labeled experimental. */
export type SpectrumQuality = 'teaching' | 'experimental'

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
  /** teaching = multi-Gaussian / group-frequency model; experimental = instrument series with open redistribution rights */
  quality: SpectrumQuality
  /**
   * When true (with quality experimental): synthetic schema demo only.
   * Must never be cited as measured data. Excluded from “Experimental only” filter.
   */
  example_not_for_citation?: boolean
  solvent?: string
  /** Absolute temperature in kelvin, if known for experimental series */
  temperature_K?: number
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
  /** True experimental UV–Vis (quality experimental, not example-only) */
  has_experimental: boolean
  /** Schema demo experimental series only (example-not-for-citation) */
  has_experimental_example: boolean
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
    /** Compounds with at least one real experimental spectrum */
    experimental?: number
    /** Schema-demo experimental fixtures (not for citation) */
    experimental_examples?: number
  }
  families: { id: string; label: string; count: number }[]
  compounds: IndexCompound[]
}
