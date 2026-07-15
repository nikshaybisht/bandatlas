/**
 * Minimal integrity suite for BandAtlas dataset + export contracts.
 * Run: npm test
 */
import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  hasFullUvVis,
  hasSearchKeyFields,
  csvHasRequiredMarkers,
  buildSampleCsv,
} from '../tools/quality-helpers.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const datasetDir = path.join(root, 'public', 'dataset')
const indexPath = path.join(datasetDir, 'index.json')

test('index.json exists and parses', () => {
  assert.ok(fs.existsSync(indexPath), 'public/dataset/index.json missing — run npm run dataset')
  const index = JSON.parse(fs.readFileSync(indexPath, 'utf8'))
  assert.ok(index.compounds, 'missing compounds array')
  assert.ok(Array.isArray(index.compounds))
  assert.ok(index.compounds.length >= 400, `expected ≥400 compounds, got ${index.compounds.length}`)
  assert.ok(index.counts?.total >= 400)
  assert.equal(index.counts.total, index.compounds.length)
})

test('index compounds have required search key fields', () => {
  const index = JSON.parse(fs.readFileSync(indexPath, 'utf8'))
  for (const c of index.compounds) {
    assert.ok(hasSearchKeyFields(c), `missing search fields: ${c?.id}`)
  }
})

test('full UV–Vis teaching set is large enough', () => {
  const index = JSON.parse(fs.readFileSync(indexPath, 'utf8'))
  const fullUv = index.compounds.filter((c) => hasFullUvVis(c))
  assert.ok(
    fullUv.length >= 40,
    `expected ≥40 full UV–Vis curves, got ${fullUv.length}`,
  )
  assert.equal(index.counts.full_spectra, fullUv.length)
})

test('known compound files exist and UV series are non-trivial', () => {
  const known = ['benzene', 'rhodamine-b', 'anthracene', 'acetone', 'toluene']
  for (const id of known) {
    const p = path.join(datasetDir, 'compounds', `${id}.json`)
    assert.ok(fs.existsSync(p), `missing compound file ${id}`)
    const c = JSON.parse(fs.readFileSync(p, 'utf8'))
    assert.equal(c.id, id)
    const abs = c.spectra?.find((s) => s.technique === 'uvvis_abs')
    assert.ok(abs, `${id} missing uvvis_abs`)
    assert.ok(
      Array.isArray(abs.display_points) && abs.display_points.length > 10,
      `${id} UV series too short`,
    )
    assert.ok(abs.source?.note, `${id} missing quality note`)
  }
})

test('at least N compounds have UV series length > 10', () => {
  const index = JSON.parse(fs.readFileSync(indexPath, 'utf8'))
  const uvIds = index.compounds.filter((c) => c.has_uvvis).map((c) => c.id)
  let long = 0
  for (const id of uvIds) {
    const c = JSON.parse(
      fs.readFileSync(path.join(datasetDir, 'compounds', `${id}.json`), 'utf8'),
    )
    const abs = c.spectra?.find((s) => s.technique === 'uvvis_abs')
    if (abs?.display_points?.length > 10) long++
  }
  assert.ok(long >= 40, `expected ≥40 long UV series, got ${long}`)
})

test('IR and Raman present on majors', () => {
  const index = JSON.parse(fs.readFileSync(indexPath, 'utf8'))
  const withIr = index.compounds.filter((c) => c.has_ir).length
  const withRa = index.compounds.filter((c) => c.has_raman).length
  assert.ok(withIr >= 400)
  assert.ok(withRa >= 400)
})

test('CSV export markers (export contract)', () => {
  const sample = buildSampleCsv()
  assert.ok(csvHasRequiredMarkers(sample))
  assert.ok(!csvHasRequiredMarkers('not a csv'))
  assert.ok(csvHasRequiredMarkers(buildSampleCsv({ unitX: 'cm-1', technique: 'ir' })))
})

test('hasFullUvVis helper', () => {
  assert.equal(hasFullUvVis({ has_uvvis: true }), true)
  assert.equal(hasFullUvVis({ has_uvvis: false }), false)
  assert.equal(hasFullUvVis({ tier: 'full' }), true)
  assert.equal(hasFullUvVis({ availability: { uvvis_abs: true } }), true)
  assert.equal(hasFullUvVis(null), false)
})
