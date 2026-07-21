/**
 * Validate data/nmr-seeds/*.json teaching (and experimental) NMR peak lists.
 * package.json script: "validate:nmr"
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const NMR_DIR = path.join(root, 'data', 'nmr-seeds')

const NUCLEI = new Set(['1H', '13C', 'H', 'C'])

/**
 * @param {object} seed
 * @param {string} [label]
 */
export function validateNmrSeed(seed, label = 'nmr-seed') {
  const errors = []
  const err = (m) => errors.push(`${label}: ${m}`)
  if (!seed || typeof seed !== 'object') {
    return { ok: false, errors: [`${label}: must be an object`] }
  }
  const id = seed.compound_id || seed.id
  if (typeof id !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id)) {
    err('compound_id must be kebab-case')
  }
  if (seed.quality != null && seed.quality !== 'teaching' && seed.quality !== 'experimental') {
    err('quality must be teaching | experimental')
  }
  if (!Array.isArray(seed.spectra) || seed.spectra.length === 0) {
    err('spectra must be a non-empty array')
    return { ok: false, errors }
  }
  for (let i = 0; i < seed.spectra.length; i++) {
    const sp = seed.spectra[i]
    const sl = `${label}.spectra[${i}]`
    if (!sp || typeof sp !== 'object') {
      err(`${sl}: must be object`)
      continue
    }
    if (!NUCLEI.has(sp.nucleus)) {
      err(`${sl}: nucleus must be 1H or 13C`)
    }
    if (typeof sp.solvent !== 'string' || !sp.solvent.trim()) {
      err(`${sl}: solvent required`)
    }
    if (!Array.isArray(sp.peaks) || sp.peaks.length === 0) {
      err(`${sl}: peaks required`)
      continue
    }
    for (let j = 0; j < sp.peaks.length; j++) {
      const p = sp.peaks[j]
      const pl = `${sl}.peaks[${j}]`
      if (typeof p.delta_ppm !== 'number' || !Number.isFinite(p.delta_ppm)) {
        err(`${pl}: delta_ppm must be finite number`)
      } else if (p.delta_ppm < -5 || p.delta_ppm > 250) {
        err(`${pl}: delta_ppm out of plausible range`)
      }
      if (p.j_hz != null && !Array.isArray(p.j_hz)) {
        err(`${pl}: j_hz must be number[] when set`)
      }
    }
    const note = sp.source?.citation || sp.source?.lit || sp.plain_caption
    if (typeof note !== 'string' || note.trim().length < 8) {
      err(`${sl}: source.citation or plain_caption required (≥8 chars)`)
    }
  }
  return { ok: errors.length === 0, errors }
}

export function loadNmrSeedFiles(dir = NMR_DIR) {
  if (!fs.existsSync(dir)) return []
  const files = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.json') && !f.startsWith('_'))
    .sort()
  const seeds = []
  for (const file of files) {
    const full = path.join(dir, file)
    let raw
    try {
      raw = JSON.parse(fs.readFileSync(full, 'utf8'))
    } catch (e) {
      throw new Error(`Invalid JSON in data/nmr-seeds/${file}: ${e.message}`)
    }
    seeds.push({ ...raw, _sourceFile: `data/nmr-seeds/${file}` })
  }
  return seeds
}

export function assertValidNmrSeeds(seeds, context = 'NMR seeds') {
  const allErrors = []
  const seen = new Set()
  for (const seed of seeds) {
    const label = seed._sourceFile || seed.compound_id || '?'
    const id = seed.compound_id || seed.id
    if (id) {
      if (seen.has(id)) allErrors.push(`${label}: duplicate compound_id ${id}`)
      seen.add(id)
    }
    const { ok, errors } = validateNmrSeed(seed, label)
    if (!ok) allErrors.push(...errors)
  }
  if (allErrors.length) {
    console.error(`\n${context}: validation failed (${allErrors.length})\n`)
    for (const e of allErrors) console.error(`  ✗ ${e}`)
    process.exit(1)
  }
}

const isMain =
  process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))

if (isMain) {
  const seeds = loadNmrSeedFiles()
  console.log(`validate:nmr — ${seeds.length} file(s) in data/nmr-seeds/`)
  assertValidNmrSeeds(seeds)
  for (const s of seeds) {
    console.log(`  ✓ ${s.compound_id || s.id}`)
  }
  console.log('validate:nmr OK')
}
