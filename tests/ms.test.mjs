/**
 * MS teaching seeds integrity.
 */
import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { simulateMsPoints } from '../tools/ms-lib.mjs'
import {
  assertValidMsSeeds,
  loadMsSeedFiles,
  validateMsSeed,
} from '../tools/validate-ms-seeds.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const datasetDir = path.join(root, 'public', 'dataset')

test('MS pilot seeds validate', () => {
  const seeds = loadMsSeedFiles()
  assert.ok(seeds.length >= 10, `expected ≥10 MS seeds, got ${seeds.length}`)
  assertValidMsSeeds(seeds)
})

test('bad MS seed fails validation', () => {
  const r = validateMsSeed({
    compound_id: 'x',
    spectra: [{ method: 'ei', peaks: [] }],
  })
  assert.equal(r.ok, false)
})

test('simulateMsPoints normalizes base peak', () => {
  const pts = simulateMsPoints([
    { mz: 100, intensity: 50 },
    { mz: 85, intensity: 100 },
  ])
  assert.ok(pts.length > 20)
  const maxY = Math.max(...pts.map((p) => p[1]))
  assert.ok(maxY > 50)
})

test('built benzene has EI MS teaching series', () => {
  const p = path.join(datasetDir, 'compounds', 'benzene.json')
  assert.ok(fs.existsSync(p), 'run npm run dataset first')
  const c = JSON.parse(fs.readFileSync(p, 'utf8'))
  assert.equal(c.flags.hasMs, true)
  const ms = c.spectra.filter((s) => s.technique === 'ms')
  assert.ok(ms.length >= 1)
  const ei = ms.find((s) => s.ms_method === 'ei')
  assert.ok(ei?.ms_peaks?.length)
  assert.equal(ei.quality, 'teaching')
  assert.ok(ei.display_points.length >= 5)
})

test('index summary reports ms count', () => {
  const summary = JSON.parse(fs.readFileSync(path.join(datasetDir, 'summary.json'), 'utf8'))
  assert.ok((summary.ms ?? 0) >= 10)
})
