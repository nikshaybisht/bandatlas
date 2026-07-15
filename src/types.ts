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
  /** Series points (build name: display_points; conceptual schema: series) */
  display_points: [number, number][]
  source: SpectrumSource
}

/** Build-computed technique flags — UI must use these, not re-derive. */
export interface CompoundFlags {
  hasFullUvVis: boolean
  hasIr: boolean
  hasRaman: boolean
  hasFluorescence?: boolean
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
  /** Camel alias from build */
  pubchemCid?: number
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
  /** Preferred: build-time flags (mirrors availability) */
  flags?: CompoundFlags
  tier: 'full' | 'catalog' | 'partial'
  /** Lab companion curated set */
  lab_set?: boolean
  labSet?: boolean
  lab_classes?: string[]
  /** family + lab classes */
  class_labels?: string[]
  classLabels?: string[]
  tags?: string[]
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
  pubchemCid?: number
  tier: 'full' | 'catalog' | 'partial'
  /** @deprecated prefer hasFullUvVis */
  has_uvvis: boolean
  hasFullUvVis?: boolean
  has_fluorescence: boolean
  /** @deprecated prefer hasIr */
  has_ir: boolean
  hasIr?: boolean
  /** @deprecated prefer hasRaman */
  has_raman: boolean
  hasRaman?: boolean
  /** True experimental UV–Vis (quality experimental, not example-only) */
  has_experimental: boolean
  /** Schema demo experimental series only (example-not-for-citation) */
  has_experimental_example: boolean
  lab_set?: boolean
  labSet?: boolean
  lab_classes?: string[]
  class_labels?: string[]
  classLabels?: string[]
  tags?: string[]
  lambda_max_nm: number[]
  solvents: string[]
}

/** Prefer camelCase build flags; fall back to snake_case for older index. */
export function indexHasFullUvVis(c: IndexCompound): boolean {
  if (typeof c.hasFullUvVis === 'boolean') return c.hasFullUvVis
  return !!c.has_uvvis
}

export function indexHasIr(c: IndexCompound): boolean {
  if (typeof c.hasIr === 'boolean') return c.hasIr
  return !!c.has_ir
}

export function indexHasRaman(c: IndexCompound): boolean {
  if (typeof c.hasRaman === 'boolean') return c.hasRaman
  return !!c.has_raman
}

export function compoundFlags(c: Compound): CompoundFlags {
  if (c.flags) return c.flags
  // Legacy compounds only — still from build availability, not UI invention
  return {
    hasFullUvVis: !!c.availability?.uvvis_abs,
    hasIr: !!c.availability?.ir,
    hasRaman: !!c.availability?.raman,
    hasFluorescence: !!c.availability?.fluorescence,
  }
}

/** App-facing defaults shipped with the dataset index (not per-compound). */
export interface DatasetAppMeta {
  /** Full-UV compound opened on first load / after dismiss when no deep link */
  default_compound_id: string
  /** Lab companion preset */
  lab: {
    compound_id: string
    technique: TechniqueTab
    /** Prefer lab-set filter (default true for /lab) */
    lab_set_only?: boolean
    uv_only?: boolean
    mode: 'simple' | 'advanced'
  }
  lab_classes?: { id: string; label: string }[]
}

export interface DatasetSummary {
  version: string
  total: number
  full_uvvis: number
  ir: number
  raman: number
  lab_set?: number
  lab_set_count?: number
  catalog_only: number
  experimental?: number
  experimental_examples?: number
  generatedAt?: string
  generated_at?: string
}

export interface DatasetIndex {
  version: string
  generated_at: string
  generatedAt?: string
  counts: {
    total: number
    full_spectra: number
    full_uvvis?: number
    catalog_only: number
    with_ir?: number
    with_raman?: number
    ir?: number
    raman?: number
    /** Compounds with at least one real experimental spectrum */
    experimental?: number
    /** Schema-demo experimental fixtures (not for citation) */
    experimental_examples?: number
    /** Curated lab companion set size */
    lab_set?: number
  }
  families: { id: string; label: string; count: number }[]
  compounds: IndexCompound[]
  /** Optional until older datasets refresh; UI has hard-coded fallbacks */
  app_meta?: DatasetAppMeta
}
