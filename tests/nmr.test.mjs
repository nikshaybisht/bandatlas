/**
 * NMR teaching seeds + multiplet simulation integrity.
 */
import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { expandMultiplet, simulateNmrPoints } from '../tools/nmr-lib.mjs'
import {
  assertValidNmrSeeds,
  loadNmrSeedFiles,
  validateNmrSeed,
} from '../tools/validate-nmr-seeds.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const datasetDir = path.join(root, 'public', 'dataset')

test('NMR pilot seeds validate', () => {
  const seeds = loadNmrSeedFiles()
  assert.ok(seeds.length >= 10, `expected ≥10 NMR seeds, got ${seeds.length}`)
  assertValidNmrSeeds(seeds)
})

test('bad NMR seed fails validation', () => {
  const r = validateNmrSeed({
    compound_id: 'x',
    spectra: [{ nucleus: '1H', solvent: 'CDCl3', peaks: [] }],
  })
  assert.equal(r.ok, false)
})

test('doublet expands to two sticks', () => {
  const sticks = expandMultiplet({
    delta_ppm: 1.2,
    multiplicity: 'd',
    integration: 3,
    j_hz: [7],
  })
  assert.equal(sticks.length, 2)
  assert.ok(Math.abs(sticks[0].height + sticks[1].height - 3) < 1e-9)
})

test('60 MHz multiplets are wider in ppm than 500 MHz', () => {
  const peaks = [{ delta_ppm: 1.2, multiplicity: 't', integration: 3, j_hz: [7] }]
  const lo = simulateNmrPoints(peaks, { fieldMhz: 60 })
  const hi = simulateNmrPoints(peaks, { fieldMhz: 500 })
  assert.ok(lo.length > 50)
  assert.ok(hi.length > 50)
  const span = (pts) => {
    const xs = pts.filter((p) => p[1] > 5).map((p) => p[0])
    return Math.max(...xs) - Math.min(...xs)
  }
  assert.ok(span(lo) > span(hi), '60 MHz multiplet should span more ppm')
})

test('built benzene has nmr_1h and nmr_13c teaching series', () => {
  const p = path.join(datasetDir, 'compounds', 'benzene.json')
  assert.ok(fs.existsSync(p), 'run npm run dataset first')
  const c = JSON.parse(fs.readFileSync(p, 'utf8'))
  assert.equal(c.flags.hasNmr1h, true)
  assert.equal(c.flags.hasNmr13c, true)
  const h = c.spectra.find((s) => s.technique === 'nmr_1h')
  const c13 = c.spectra.find((s) => s.technique === 'nmr_13c')
  assert.ok(h?.nmr_peaks?.length)
  assert.ok(c13?.nmr_peaks?.length)
  assert.equal(h.quality, 'teaching')
  assert.ok(h.display_points.length >= 5)
})

test('index summary reports nmr counts', () => {
  const summary = JSON.parse(fs.readFileSync(path.join(datasetDir, 'summary.json'), 'utf8'))
  assert.ok((summary.nmr_1h ?? 0) >= 10)
  assert.ok((summary.nmr_13c ?? 0) >= 10)
  const index = JSON.parse(fs.readFileSync(path.join(datasetDir, 'index.json'), 'utf8'))
  const withH = index.compounds.filter((c) => c.has_nmr_1h || c.hasNmr1h).length
  assert.equal(withH, summary.nmr_1h)
})
