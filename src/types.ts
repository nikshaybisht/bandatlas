export type Technique =
  | 'uvvis_abs'
  | 'fluorescence'
  | 'ir'
  | 'raman'
  | 'nmr_1h'
  | 'nmr_13c'
  | 'ms'

export type TechniqueTab = 'uvvis' | 'ir' | 'raman' | 'nmr1h' | 'nmr13c' | 'ms'

export type MsMethod = 'ei' | 'esi' | 'hrms' | 'maldi_tof'

export interface MsPeak {
  mz: number
  intensity: number
  formula?: string
  label?: string
}

// teaching envelopes must stay "teaching" — never relabel as experimental
export type SpectrumQuality = 'teaching' | 'experimental'

export type NmrNucleus = '1H' | '13C'

export interface NmrPeak {
  delta_ppm: number
  multiplicity?: string
  integration?: number
  j_hz?: number[]
  label?: string
}

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
  quality: SpectrumQuality
  // synthetic schema demo when quality is experimental — excluded from "Experimental only"
  example_not_for_citation?: boolean
  solvent?: string
  temperature_K?: number
  y_unit: 'epsilon' | 'normalized' | 'absorbance'
  y_unit_label: string
  lambda_max_nm?: number[]
  epsilon_max?: number[]
  peak_positions?: number[]
  peak_labels?: string[]
  quantum_yield?: number
  plain_caption: string
  display_points: [number, number][]
  source: SpectrumSource
  /** NMR-only fields */
  nucleus?: NmrNucleus
  reference?: string
  field_mhz_default?: number
  nmr_peaks?: NmrPeak[]
  /** MS-only fields */
  ms_method?: MsMethod
  ionization?: string
  polarity?: string
  matrix?: string
  exact_mass?: number
  molecular_ion_mz?: number
  ms_peaks?: MsPeak[]
}

// flags come from the dataset build — don't re-derive in the UI
export interface CompoundFlags {
  hasFullUvVis: boolean
  hasIr: boolean
  hasRaman: boolean
  hasFluorescence?: boolean
  hasNmr1h?: boolean
  hasNmr13c?: boolean
  hasMs?: boolean
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
  /** Canonical PubChem CID (snake_case is source of truth in JSON). */
  pubchem_cid: number
  /** @deprecated Alias of pubchem_cid — prefer pubchem_cid */
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
    nmr_1h?: boolean
    nmr_13c?: boolean
    ms?: boolean
  }
  flags?: CompoundFlags
  tier: 'full' | 'catalog' | 'partial'
  lab_set?: boolean
  /** @deprecated Alias of lab_set */
  labSet?: boolean
  lab_classes?: string[]
  class_labels?: string[]
  /** @deprecated Alias of class_labels */
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
  /** @deprecated Alias of pubchem_cid */
  pubchemCid?: number
  tier: 'full' | 'catalog' | 'partial'
  /** Canonical full-UV flag from dataset build */
  has_uvvis: boolean
  /** @deprecated Alias of has_uvvis */
  hasFullUvVis?: boolean
  has_fluorescence: boolean
  has_ir: boolean
  /** @deprecated Alias of has_ir */
  hasIr?: boolean
  has_raman: boolean
  /** @deprecated Alias of has_raman */
  hasRaman?: boolean
  has_nmr_1h?: boolean
  hasNmr1h?: boolean
  has_nmr_13c?: boolean
  hasNmr13c?: boolean
  has_ms?: boolean
  hasMs?: boolean
  has_experimental: boolean
  has_experimental_example: boolean
  lab_set?: boolean
  /** @deprecated Alias of lab_set */
  labSet?: boolean
  lab_classes?: string[]
  class_labels?: string[]
  /** @deprecated Alias of class_labels */
  classLabels?: string[]
  tags?: string[]
  lambda_max_nm: number[]
  solvents: string[]
}

/** Prefer snake_case index fields; camelCase aliases still accepted. */
export function indexHasFullUvVis(c: IndexCompound): boolean {
  return !!(c.has_uvvis ?? c.hasFullUvVis)
}

export function indexHasIr(c: IndexCompound): boolean {
  return !!(c.has_ir ?? c.hasIr)
}

export function indexHasRaman(c: IndexCompound): boolean {
  return !!(c.has_raman ?? c.hasRaman)
}

export function compoundFlags(c: Compound): CompoundFlags {
  if (c.flags) {
    return {
      hasFullUvVis: c.flags.hasFullUvVis,
      hasIr: c.flags.hasIr,
      hasRaman: c.flags.hasRaman,
      hasFluorescence: c.flags.hasFluorescence,
      hasNmr1h:
        typeof c.flags.hasNmr1h === 'boolean'
          ? c.flags.hasNmr1h
          : !!c.availability?.nmr_1h || c.spectra.some((s) => s.technique === 'nmr_1h'),
      hasNmr13c:
        typeof c.flags.hasNmr13c === 'boolean'
          ? c.flags.hasNmr13c
          : !!c.availability?.nmr_13c || c.spectra.some((s) => s.technique === 'nmr_13c'),
      hasMs:
        typeof c.flags.hasMs === 'boolean'
          ? c.flags.hasMs
          : !!c.availability?.ms || c.spectra.some((s) => s.technique === 'ms'),
    }
  }
  return {
    hasFullUvVis: !!c.availability?.uvvis_abs,
    hasIr: !!c.availability?.ir,
    hasRaman: !!c.availability?.raman,
    hasFluorescence: !!c.availability?.fluorescence,
    hasNmr1h: !!c.availability?.nmr_1h || c.spectra.some((s) => s.technique === 'nmr_1h'),
    hasNmr13c: !!c.availability?.nmr_13c || c.spectra.some((s) => s.technique === 'nmr_13c'),
    hasMs: !!c.availability?.ms || c.spectra.some((s) => s.technique === 'ms'),
  }
}

export interface DatasetAppMeta {
  default_compound_id: string
  lab: {
    compound_id: string
    technique: TechniqueTab
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
    experimental?: number
    experimental_examples?: number
    lab_set?: number
  }
  families: { id: string; label: string; count: number }[]
  compounds: IndexCompound[]
  app_meta?: DatasetAppMeta
}
