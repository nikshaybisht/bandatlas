/**
 * Dataset “backend” schema validator for built compound records + index + summary.
 * Enforced at end of the dataset build. Pure API for unit tests.
 *
 * Wire format notes:
 * - Spectra are a technique-tagged array (uvvis_abs | fluorescence | ir | raman | nmr_1h | nmr_13c | ms).
 * - Conceptual map: series → display_points, classLabels → class_labels / family + lab_classes,
 *   hasFullUvVis → flags.hasFullUvVis / has_uvvis.
 * - quality enum: teaching | experimental only.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { safeDoiUrl, safeHttpUrl } from './safe-url.mjs'

const QUALITIES = new Set(['teaching', 'experimental'])
const TECHNIQUES = new Set([
  'uvvis_abs',
  'fluorescence',
  'ir',
  'raman',
  'nmr_1h',
  'nmr_13c',
  'ms',
])

/**
 * @param {unknown} spectrum
 * @param {string} label
 * @returns {string[]}
 */
export function validateSpectrum(spectrum, label = 'spectrum') {
  const errors = []
  const err = (m) => errors.push(`${label}: ${m}`)
  if (!spectrum || typeof spectrum !== 'object') {
    return [`${label}: must be an object`]
  }
  const s = /** @type {Record<string, unknown>} */ (spectrum)

  if (typeof s.id !== 'string' || !s.id.trim()) err('id required')
  if (typeof s.technique !== 'string' || !TECHNIQUES.has(s.technique)) {
    err(`technique must be one of ${[...TECHNIQUES].join(', ')}`)
  }
  if (typeof s.quality !== 'string' || !QUALITIES.has(s.quality)) {
    err('quality must be "teaching" | "experimental"')
  }
  if (!s.source || typeof s.source !== 'object') {
    err('source object required')
  } else {
    const src = /** @type {Record<string, unknown>} */ (s.source)
    if (typeof src.citation !== 'string' || !src.citation.trim()) {
      err('source.citation required')
    }
    if (src.url != null && src.url !== '') {
      if (typeof src.url !== 'string' || !safeHttpUrl(src.url)) {
        err('source.url must be http(s) only (no javascript:/data:)')
      }
    }
    if (src.doi != null && src.doi !== '') {
      if (typeof src.doi !== 'string' || !safeDoiUrl(src.doi)) {
        err('source.doi must look like 10.xxxx/suffix')
      }
    }
    if (s.quality === 'experimental' && !src.doi && !src.url) {
      err('experimental spectra require source.doi or source.url')
    }
    // After shape checks: experimental must resolve to a safe link
    if (s.quality === 'experimental') {
      const okUrl = src.url ? safeHttpUrl(src.url) : null
      const okDoi = src.doi ? safeDoiUrl(src.doi) : null
      if (!okUrl && !okDoi) {
        err('experimental spectra need a valid http(s) url or DOI')
      }
    }
  }
  if (!Array.isArray(s.display_points) || s.display_points.length < 5) {
    err('display_points (series) must have ≥5 [x,y] points')
  } else {
    const pt = s.display_points[0]
    if (!Array.isArray(pt) || pt.length < 2 || typeof pt[0] !== 'number' || typeof pt[1] !== 'number') {
      err('display_points entries must be [number, number]')
    }
  }
  if (s.technique === 'uvvis_abs' || s.technique === 'fluorescence') {
    // peaks optional but if present must be numbers
    if (s.lambda_max_nm != null) {
      if (!Array.isArray(s.lambda_max_nm)) err('lambda_max_nm must be an array when set')
      else {
        for (const λ of s.lambda_max_nm) {
          if (typeof λ !== 'number' || !Number.isFinite(λ)) {
            err('lambda_max_nm values must be finite numbers')
            break
          }
        }
      }
    }
  }
  return errors
}

/**
 * Full compound JSON under public/dataset/compounds/*.json
 * @param {unknown} compound
 * @param {{ label?: string }} [opts]
 * @returns {{ ok: boolean, errors: string[] }}
 */
export function validateCompoundRecord(compound, opts = {}) {
  const label = opts.label || (compound && /** @type {any} */ (compound).id) || 'compound'
  const errors = []
  const err = (m) => errors.push(`${label}: ${m}`)

  if (!compound || typeof compound !== 'object') {
    return { ok: false, errors: [`${label}: must be an object`] }
  }
  const c = /** @type {Record<string, any>} */ (compound)

  if (typeof c.id !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(c.id)) {
    err('id must be kebab-case slug')
  }
  if (typeof c.name !== 'string' || !c.name.trim()) err('name required')
  if (typeof c.formula !== 'string' || !c.formula.trim()) err('formula required')

  // smiles? cas? pubchemCid? / pubchem_cid
  if (c.smiles != null && typeof c.smiles !== 'string') err('smiles must be string when set')
  if (c.cas != null && typeof c.cas !== 'string') err('cas must be string when set')
  const cid = c.pubchem_cid ?? c.pubchemCid
  if (cid != null && (typeof cid !== 'number' || !Number.isFinite(cid) || cid < 0)) {
    err('pubchem_cid / pubchemCid must be a non-negative number when set')
  }

  // classLabels[]
  const classLabels = c.class_labels || c.classLabels
  if (classLabels != null) {
    if (!Array.isArray(classLabels) || !classLabels.every((x) => typeof x === 'string')) {
      err('class_labels / classLabels must be string[]')
    }
  } else if (typeof c.family !== 'string' || !c.family.trim()) {
    err('family or class_labels required')
  }

  // labSet?
  const labSet = c.lab_set ?? c.labSet
  if (labSet != null && typeof labSet !== 'boolean') err('lab_set / labSet must be boolean')

  if (!Array.isArray(c.spectra)) {
    err('spectra must be an array of technique records')
  } else {
    c.spectra.forEach((sp, i) => {
      errors.push(...validateSpectrum(sp, `${label}.spectra[${i}]`))
    })
  }

  // flags (computed at build — required on new builds)
  const flags = c.flags
  if (!flags || typeof flags !== 'object') {
    err('flags { hasFullUvVis, hasIr, hasRaman, hasNmr1h, hasNmr13c, hasMs } required (computed at build)')
  } else {
    for (const k of ['hasFullUvVis', 'hasIr', 'hasRaman', 'hasNmr1h', 'hasNmr13c', 'hasMs']) {
      if (typeof flags[k] !== 'boolean') err(`flags.${k} must be boolean`)
    }
    // Consistency with series presence
    const hasUv = c.spectra?.some((s) => s.technique === 'uvvis_abs')
    const hasIr = c.spectra?.some((s) => s.technique === 'ir')
    const hasRa = c.spectra?.some((s) => s.technique === 'raman')
    const hasH = c.spectra?.some((s) => s.technique === 'nmr_1h')
    const hasC = c.spectra?.some((s) => s.technique === 'nmr_13c')
    const hasMs = c.spectra?.some((s) => s.technique === 'ms')
    if (flags.hasFullUvVis !== !!hasUv) {
      err(`flags.hasFullUvVis (${flags.hasFullUvVis}) ≠ presence of uvvis_abs series`)
    }
    if (flags.hasIr !== !!hasIr) err(`flags.hasIr inconsistent with ir series`)
    if (flags.hasRaman !== !!hasRa) err(`flags.hasRaman inconsistent with raman series`)
    if (flags.hasNmr1h !== !!hasH) err(`flags.hasNmr1h inconsistent with nmr_1h series`)
    if (flags.hasNmr13c !== !!hasC) err(`flags.hasNmr13c inconsistent with nmr_13c series`)
    if (flags.hasMs !== !!hasMs) err(`flags.hasMs inconsistent with ms series`)
  }

  // labSet requires full UV
  if (labSet === true && flags && flags.hasFullUvVis !== true) {
    err('labSet compounds must have flags.hasFullUvVis true')
  }

  // availability mirrors flags when present
  if (c.availability && flags) {
    if (c.availability.uvvis_abs !== flags.hasFullUvVis) {
      err('availability.uvvis_abs must match flags.hasFullUvVis')
    }
    if (c.availability.ir !== flags.hasIr) err('availability.ir must match flags.hasIr')
    if (c.availability.raman !== flags.hasRaman) {
      err('availability.raman must match flags.hasRaman')
    }
    if (c.availability.nmr_1h != null && c.availability.nmr_1h !== flags.hasNmr1h) {
      err('availability.nmr_1h must match flags.hasNmr1h')
    }
    if (c.availability.nmr_13c != null && c.availability.nmr_13c !== flags.hasNmr13c) {
      err('availability.nmr_13c must match flags.hasNmr13c')
    }
    if (c.availability.ms != null && c.availability.ms !== flags.hasMs) {
      err('availability.ms must match flags.hasMs')
    }
  }

  return { ok: errors.length === 0, errors }
}

/**
 * Search index compound entry
 * @param {unknown} entry
 * @returns {{ ok: boolean, errors: string[] }}
 */
export function validateIndexEntry(entry) {
  const label = (entry && /** @type {any} */ (entry).id) || 'index'
  const errors = []
  const err = (m) => errors.push(`${label}: ${m}`)
  if (!entry || typeof entry !== 'object') {
    return { ok: false, errors: [`${label}: must be object`] }
  }
  const e = /** @type {Record<string, any>} */ (entry)

  if (typeof e.id !== 'string' || !e.id) err('id required')
  if (typeof e.name !== 'string' || !e.name) err('name required')
  if (typeof e.formula !== 'string') err('formula required')

  // Build-computed flags (snake + camel)
  const full =
    typeof e.hasFullUvVis === 'boolean'
      ? e.hasFullUvVis
      : typeof e.has_uvvis === 'boolean'
        ? e.has_uvvis
        : null
  if (full === null) err('hasFullUvVis or has_uvvis boolean required')

  const ir =
    typeof e.hasIr === 'boolean' ? e.hasIr : typeof e.has_ir === 'boolean' ? e.has_ir : null
  if (ir === null) err('hasIr or has_ir boolean required')

  const ra =
    typeof e.hasRaman === 'boolean'
      ? e.hasRaman
      : typeof e.has_raman === 'boolean'
        ? e.has_raman
        : null
  if (ra === null) err('hasRaman or has_raman boolean required')

  // aliases must agree when both present
  if (typeof e.hasFullUvVis === 'boolean' && typeof e.has_uvvis === 'boolean') {
    if (e.hasFullUvVis !== e.has_uvvis) err('hasFullUvVis ≠ has_uvvis')
  }
  if (typeof e.hasIr === 'boolean' && typeof e.has_ir === 'boolean') {
    if (e.hasIr !== e.has_ir) err('hasIr ≠ has_ir')
  }
  if (typeof e.hasRaman === 'boolean' && typeof e.has_raman === 'boolean') {
    if (e.hasRaman !== e.has_raman) err('hasRaman ≠ has_raman')
  }

  const labSet = e.labSet ?? e.lab_set
  if (labSet === true && full !== true) {
    err('labSet entry must have hasFullUvVis true')
  }

  if (e.classLabels != null || e.class_labels != null) {
    const cl = e.classLabels || e.class_labels
    if (!Array.isArray(cl) || !cl.every((x) => typeof x === 'string')) {
      err('classLabels must be string[]')
    }
  }

  return { ok: errors.length === 0, errors }
}

/**
 * @param {unknown} summary
 * @returns {{ ok: boolean, errors: string[] }}
 */
export function validateSummary(summary) {
  const errors = []
  const err = (m) => errors.push(`summary: ${m}`)
  if (!summary || typeof summary !== 'object') {
    return { ok: false, errors: ['summary: must be object'] }
  }
  const s = /** @type {Record<string, any>} */ (summary)
  for (const k of ['version', 'total', 'full_uvvis', 'ir', 'raman', 'catalog_only']) {
    if (s[k] == null) err(`missing ${k}`)
  }
  if (typeof s.total !== 'number' || s.total < 1) err('total must be positive number')
  if (typeof s.full_uvvis !== 'number') err('full_uvvis must be number')
  // hard floor so we notice accidental UV wipeouts in the seed set
  if (s.full_uvvis < 80) err(`full_uvvis dropped below 80 (got ${s.full_uvvis})`)
  const lab = s.lab_set ?? s.lab_set_count
  if (lab == null || typeof lab !== 'number') err('lab_set or lab_set_count required')
  if (!s.generatedAt && !s.generated_at) err('generatedAt (or generated_at) required')
  return { ok: errors.length === 0, errors }
}

/**
 * Validate entire public/dataset tree after build.
 * @param {string} datasetDir
 * @returns {{ ok: boolean, errors: string[], stats: object }}
 */
export function validateDatasetTree(datasetDir) {
  const errors = []
  const indexPath = path.join(datasetDir, 'index.json')
  const summaryPath = path.join(datasetDir, 'summary.json')
  const compoundsDir = path.join(datasetDir, 'compounds')

  if (!fs.existsSync(indexPath)) errors.push('index.json missing')
  if (!fs.existsSync(summaryPath)) errors.push('summary.json missing')
  if (!fs.existsSync(compoundsDir)) errors.push('compounds/ missing')
  if (errors.length) return { ok: false, errors, stats: {} }

  const index = JSON.parse(fs.readFileSync(indexPath, 'utf8'))
  const summary = JSON.parse(fs.readFileSync(summaryPath, 'utf8'))

  const sumR = validateSummary(summary)
  errors.push(...sumR.errors)

  if (!Array.isArray(index.compounds)) {
    errors.push('index.compounds must be array')
  } else {
    for (const entry of index.compounds) {
      const r = validateIndexEntry(entry)
      if (!r.ok) errors.push(...r.errors.slice(0, 3))
    }
  }

  // Spot-check every lab_set + sample of all compounds
  let checked = 0
  let labChecked = 0
  if (Array.isArray(index.compounds)) {
    for (const entry of index.compounds) {
      const file = path.join(compoundsDir, `${entry.id}.json`)
      if (!fs.existsSync(file)) {
        errors.push(`missing compound file ${entry.id}.json`)
        continue
      }
      const isLab = entry.lab_set === true || entry.labSet === true
      // Always validate lab set fully; validate all compounds for schema integrity
      const c = JSON.parse(fs.readFileSync(file, 'utf8'))
      const r = validateCompoundRecord(c, { label: entry.id })
      if (!r.ok) errors.push(...r.errors.slice(0, 5))
      checked++
      if (isLab) labChecked++
    }
  }

  // Counts: summary vs index
  if (Array.isArray(index.compounds) && summary) {
    const n = index.compounds.length
    if (summary.total !== n) errors.push(`summary.total ${summary.total} ≠ index ${n}`)
    const full = index.compounds.filter((c) => c.hasFullUvVis ?? c.has_uvvis).length
    if (summary.full_uvvis !== full) {
      errors.push(`summary.full_uvvis ${summary.full_uvvis} ≠ counted ${full}`)
    }
    const lab = index.compounds.filter((c) => c.lab_set || c.labSet).length
    const sumLab = summary.lab_set ?? summary.lab_set_count
    if (sumLab !== lab) errors.push(`summary lab_set ${sumLab} ≠ counted ${lab}`)
    if (index.counts?.total != null && index.counts.total !== n) {
      errors.push(`index.counts.total mismatch`)
    }
  }

  return {
    ok: errors.length === 0,
    errors,
    stats: { compoundsChecked: checked, labChecked },
  }
}

// CLI
const isMain =
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)

if (isMain) {
  const datasetDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'public', 'dataset')
  const result = validateDatasetTree(datasetDir)
  if (!result.ok) {
    console.error('validate-dataset FAILED:')
    for (const e of result.errors.slice(0, 40)) console.error('  ·', e)
    if (result.errors.length > 40) console.error(`  … +${result.errors.length - 40} more`)
    process.exit(1)
  }
  console.log(
    `validate-dataset OK (${result.stats.compoundsChecked} compounds, ${result.stats.labChecked} lab set)`,
  )
}
