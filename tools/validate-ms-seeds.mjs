/**
 * Validate data/ms-seeds/*.json
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { MS_METHODS } from './ms-lib.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const MS_DIR = path.join(root, 'data', 'ms-seeds')

/**
 * @param {object} seed
 * @param {string} [label]
 */
export function validateMsSeed(seed, label = 'ms-seed') {
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
    const method = String(sp.method || '').toLowerCase()
    if (!MS_METHODS.has(method)) {
      err(`${sl}: method must be one of ${[...MS_METHODS].join(', ')}`)
    }
    if (!Array.isArray(sp.peaks) || sp.peaks.length === 0) {
      err(`${sl}: peaks required`)
      continue
    }
    for (let j = 0; j < sp.peaks.length; j++) {
      const p = sp.peaks[j]
      const pl = `${sl}.peaks[${j}]`
      if (typeof p.mz !== 'number' || !Number.isFinite(p.mz) || p.mz <= 0) {
        err(`${pl}: mz must be positive number`)
      }
      const inten = p.intensity ?? p.rel_intensity
      if (typeof inten !== 'number' || !Number.isFinite(inten) || inten < 0) {
        err(`${pl}: intensity must be non-negative number`)
      }
    }
    const note = sp.source?.citation || sp.source?.lit || sp.plain_caption
    if (typeof note !== 'string' || note.trim().length < 8) {
      err(`${sl}: source.citation or plain_caption required`)
    }
  }
  return { ok: errors.length === 0, errors }
}

export function loadMsSeedFiles(dir = MS_DIR) {
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
      throw new Error(`Invalid JSON in data/ms-seeds/${file}: ${e.message}`)
    }
    seeds.push({ ...raw, _sourceFile: `data/ms-seeds/${file}` })
  }
  return seeds
}

export function assertValidMsSeeds(seeds, context = 'MS seeds') {
  const allErrors = []
  const seen = new Set()
  for (const seed of seeds) {
    const label = seed._sourceFile || seed.compound_id || '?'
    const id = seed.compound_id || seed.id
    if (id) {
      if (seen.has(id)) allErrors.push(`${label}: duplicate compound_id ${id}`)
      seen.add(id)
    }
    const { ok, errors } = validateMsSeed(seed, label)
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
  const seeds = loadMsSeedFiles()
  console.log(`validate:ms — ${seeds.length} file(s) in data/ms-seeds/`)
  assertValidMsSeeds(seeds)
  for (const s of seeds) console.log(`  ✓ ${s.compound_id || s.id}`)
  console.log('validate:ms OK')
}
