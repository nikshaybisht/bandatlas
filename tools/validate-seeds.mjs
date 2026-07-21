/**
 * Validate UV teaching seeds in data/uv-seeds/*.json.
 *
 * package.json script: "validate:seeds"
 * API:  import { validateUvSeed, assertValidSeeds, loadUvSeedFiles } from './validate-seeds.mjs'
 *
 * See docs/ADD_SPECTRUM.md for the contributor path.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const UV_SEEDS_DIR = path.join(root, 'data', 'uv-seeds')

const KNOWN_FAMILIES = new Set([
  'aromatic-hydrocarbons',
  'pahs',
  'dyes',
  'xanthenes',
  'coumarins',
  'porphyrins',
  'biomolecules',
  'solvents',
  'heterocycles',
  'pharmaceuticals',
  'food',
  'quinones',
])

/**
 * @param {object} seed
 * @param {{ label?: string, requireSourceNote?: boolean }} [opts]
 *   requireSourceNote defaults true for data/uv-seeds.
 * @returns {{ ok: boolean, errors: string[] }}
 */
export function validateUvSeed(seed, opts = {}) {
  const label = opts.label || seed?.id || 'seed'
  const requireSourceNote = opts.requireSourceNote !== false
  const errors = []
  const err = (msg) => errors.push(`${label}: ${msg}`)

  if (!seed || typeof seed !== 'object') {
    return { ok: false, errors: [`${label}: seed must be an object`] }
  }

  if (typeof seed.id !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(seed.id)) {
    err('id must be a kebab-case slug (e.g. "rhodamine-b")')
  }
  if (typeof seed.name !== 'string' || !seed.name.trim()) {
    err('name is required')
  }
  if (typeof seed.family !== 'string' || !seed.family.trim()) {
    err('family is required')
  } else if (!KNOWN_FAMILIES.has(seed.family)) {
    err(
      `family "${seed.family}" unknown — use one of: ${[...KNOWN_FAMILIES].join(', ')}`,
    )
  }
  if (typeof seed.formula !== 'string' || !seed.formula.trim()) {
    err('formula is required')
  }
  if (typeof seed.plain_summary !== 'string' || seed.plain_summary.trim().length < 12) {
    err('plain_summary is required (≥12 chars, teaching-friendly)')
  }

  const cid = seed.pubchem_cid
  const smiles = typeof seed.smiles === 'string' ? seed.smiles.trim() : ''
  const hasCid = typeof cid === 'number' && Number.isFinite(cid) && cid > 0
  if (!hasCid && !smiles) {
    err('pubchem_cid (positive number) or smiles is required')
  }
  if (cid != null && !hasCid) {
    err('pubchem_cid must be a positive number when set')
  }

  // seeds are teaching-only
  if (seed.quality != null && seed.quality !== 'teaching') {
    err('UV teaching seeds must use quality: "teaching" (or omit; experimental uses data/experimental/)')
  }

  const abs = seed.abs
  if (!abs || typeof abs !== 'object') {
    err('abs { solvent, peaks, lambda_max_nm, xMin, xMax, … } is required')
    return { ok: false, errors }
  }

  if (typeof abs.solvent !== 'string' || !abs.solvent.trim()) {
    err('abs.solvent is required')
  }

  if (!Array.isArray(abs.lambda_max_nm) || abs.lambda_max_nm.length === 0) {
    err('abs.lambda_max_nm must be a non-empty number array')
  } else {
    abs.lambda_max_nm.forEach((λ, i) => {
      if (typeof λ !== 'number' || !Number.isFinite(λ) || λ < 100 || λ > 1200) {
        err(`abs.lambda_max_nm[${i}] must be a finite wavelength (100–1200 nm)`)
      }
    })
  }

  const sourceNote = abs.quality_note || abs.lit || abs.source_note
  if (typeof sourceNote !== 'string' || sourceNote.trim().length < 8) {
    if (requireSourceNote) {
      err('abs.lit or abs.quality_note (source note for λ_max) is required')
    } else if (typeof abs.plain_caption !== 'string' || abs.plain_caption.trim().length < 8) {
      err('abs.plain_caption or abs.lit / quality_note required')
    }
  }

  if (abs.quality != null && abs.quality !== 'teaching') {
    err('abs.quality must be "teaching" for UV teaching seeds')
  }

  if (typeof abs.xMin !== 'number' || typeof abs.xMax !== 'number' || !(abs.xMin < abs.xMax)) {
    err('abs.xMin and abs.xMax required with xMin < xMax')
  }

  if (!Array.isArray(abs.peaks) || abs.peaks.length === 0) {
    err('abs.peaks must be a non-empty array of { lambda, height, sigma }')
  } else {
    abs.peaks.forEach((p, i) => {
      if (!p || typeof p !== 'object') {
        err(`abs.peaks[${i}] must be an object`)
        return
      }
      if (typeof p.lambda !== 'number' || !Number.isFinite(p.lambda)) {
        err(`abs.peaks[${i}].lambda must be a number`)
      }
      if (typeof p.height !== 'number' || !(p.height > 0)) {
        err(`abs.peaks[${i}].height must be a positive number`)
      }
      if (typeof p.sigma !== 'number' || !(p.sigma > 0)) {
        err(`abs.peaks[${i}].sigma must be a positive number`)
      }
      if (abs.xMin != null && abs.xMax != null && typeof p.lambda === 'number') {
        if (p.lambda < abs.xMin - 5 || p.lambda > abs.xMax + 5) {
          err(`abs.peaks[${i}].lambda ${p.lambda} outside xMin/xMax range`)
        }
      }
    })
  }

  if (abs.plain_caption != null && typeof abs.plain_caption !== 'string') {
    err('abs.plain_caption must be a string when set')
  }

  // Optional emission
  if (seed.em != null) {
    const em = seed.em
    if (typeof em !== 'object') {
      err('em must be an object when set')
    } else {
      if (typeof em.solvent !== 'string' || !em.solvent.trim()) err('em.solvent is required when em is set')
      if (!Array.isArray(em.peaks) || em.peaks.length === 0) err('em.peaks required when em is set')
      if (typeof em.xMin !== 'number' || typeof em.xMax !== 'number' || !(em.xMin < em.xMax)) {
        err('em.xMin < em.xMax required when em is set')
      }
    }
  }

  return { ok: errors.length === 0, errors }
}

/**
 * Load additive UV teaching seeds from data/uv-seeds/*.json
 * Files starting with `_` are templates/docs only and are skipped.
 */
export function loadUvSeedFiles(dir = UV_SEEDS_DIR) {
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
      throw new Error(`Invalid JSON in data/uv-seeds/${file}: ${e.message}`)
    }
    const list = Array.isArray(raw) ? raw : [raw]
    for (const seed of list) {
      seeds.push({ ...seed, _sourceFile: `data/uv-seeds/${file}`, _external: true })
    }
  }
  return seeds
}

/**
 * @param {object[]} seeds
 * @param {string} [context]
 * @param {{ requireSourceNote?: boolean }} [opts]
 */
export function assertValidSeeds(seeds, context = 'UV seeds', opts = {}) {
  if (!Array.isArray(seeds)) {
    console.error(`${context}: expected an array`)
    process.exit(1)
  }
  const seen = new Set()
  const allErrors = []
  for (const seed of seeds) {
    const label = seed._sourceFile ? `${seed._sourceFile} (${seed.id || '?'})` : seed.id || '?'
    if (seed.id) {
      if (seen.has(seed.id)) allErrors.push(`${label}: duplicate id "${seed.id}"`)
      seen.add(seed.id)
    }
    // External JSON seeds always require source notes; built-in may relax.
    const requireSourceNote =
      opts.requireSourceNote !== undefined
        ? opts.requireSourceNote
        : Boolean(seed._sourceFile || seed._external)
    const { ok, errors } = validateUvSeed(seed, { label, requireSourceNote })
    if (!ok) allErrors.push(...errors)
  }
  if (allErrors.length) {
    console.error(`\n${context}: validation failed (${allErrors.length} error(s))\n`)
    for (const e of allErrors) console.error(`  ✗ ${e}`)
    console.error('\nSee docs/ADD_SPECTRUM.md for the seed format.\n')
    process.exit(1)
  }
}

// CLI
const isMain =
  process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))

if (isMain) {
  const extras = loadUvSeedFiles()
  console.log(`validate:seeds — checking ${extras.length} file(s) in data/uv-seeds/ (+ template fixture)`)

  // Always validate the documented example fixture
  const fixturePath = path.join(root, 'tools', 'fixtures', 'uv-seed.example.json')
  if (fs.existsSync(fixturePath)) {
    const fixture = JSON.parse(fs.readFileSync(fixturePath, 'utf8'))
    const r = validateUvSeed(fixture, { label: 'tools/fixtures/uv-seed.example.json' })
    if (!r.ok) {
      console.error('Example fixture failed validation (docs out of sync):')
      r.errors.forEach((e) => console.error('  ✗', e))
      process.exit(1)
    }
    console.log('  ✓ tools/fixtures/uv-seed.example.json')
  }

  // Bad fixture must fail
  const badPath = path.join(root, 'tools', 'fixtures', 'uv-seed.bad.json')
  if (fs.existsSync(badPath)) {
    const bad = JSON.parse(fs.readFileSync(badPath, 'utf8'))
    const r = validateUvSeed(bad, { label: 'bad-fixture' })
    if (r.ok) {
      console.error('Expected bad fixture to fail validation')
      process.exit(1)
    }
    console.log(`  ✓ bad fixture rejected (${r.errors.length} error(s) as expected)`)
  }

  assertValidSeeds(extras, 'data/uv-seeds')
  for (const s of extras) {
    console.log(`  ✓ ${s.id}${s._sourceFile ? ` (${s._sourceFile})` : ''}`)
  }
  console.log('validate:seeds OK')
}
