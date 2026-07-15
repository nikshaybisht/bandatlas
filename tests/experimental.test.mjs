/**
 * Experimental quality schema tests.
 */
import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  validateExperimentalSpectrum,
  qualityBadgeLabel,
} from '../tools/quality-helpers.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const fixturePath = path.join(__dirname, 'fixtures', 'experimental-spectrum.fixture.json')
const schemaExamplePath = path.join(root, 'data', 'experimental', 'schema-example.json')
const datasetDir = path.join(root, 'public', 'dataset')

test('fixture experimental spectrum validates schema', () => {
  const fixture = JSON.parse(fs.readFileSync(fixturePath, 'utf8'))
  const result = validateExperimentalSpectrum(fixture)
  assert.equal(result.ok, true, result.errors.join('; '))
  assert.equal(fixture.quality, 'experimental')
  assert.ok(fixture.source.doi || fixture.source.url)
  assert.ok(fixture.solvent)
  assert.equal(typeof fixture.temperature_K, 'number')
})

test('schema-example.json is experimental + example-not-for-citation', () => {
  const raw = JSON.parse(fs.readFileSync(schemaExamplePath, 'utf8'))
  const result = validateExperimentalSpectrum(raw.spectrum)
  assert.equal(result.ok, true, result.errors.join('; '))
  assert.equal(raw.spectrum.example_not_for_citation, true)
  assert.match(raw.spectrum.source.note || '', /example-not-for-citation/i)
})

test('built dataset: all teaching spectra stay quality teaching', () => {
  const index = JSON.parse(fs.readFileSync(path.join(datasetDir, 'index.json'), 'utf8'))
  // Sample teaching compound (not the schema demo)
  const benzene = JSON.parse(
    fs.readFileSync(path.join(datasetDir, 'compounds', 'benzene.json'), 'utf8'),
  )
  for (const s of benzene.spectra) {
    assert.equal(s.quality, 'teaching', `benzene ${s.id} must remain teaching`)
    assert.notEqual(s.quality, 'experimental')
  }
  // Index flag for benzene should not be real experimental
  const row = index.compounds.find((c) => c.id === 'benzene')
  assert.ok(row)
  assert.equal(row.has_experimental, false)
})

test('built schema-example-uv compound has experimental example series', () => {
  const p = path.join(datasetDir, 'compounds', 'schema-example-uv.json')
  assert.ok(fs.existsSync(p), 'schema-example-uv missing — run npm run dataset')
  const c = JSON.parse(fs.readFileSync(p, 'utf8'))
  const abs = c.spectra.find((s) => s.technique === 'uvvis_abs')
  assert.ok(abs)
  assert.equal(abs.quality, 'experimental')
  assert.equal(abs.example_not_for_citation, true)
  const result = validateExperimentalSpectrum(abs)
  assert.equal(result.ok, true, result.errors.join('; '))

  const index = JSON.parse(fs.readFileSync(path.join(datasetDir, 'index.json'), 'utf8'))
  const row = index.compounds.find((x) => x.id === 'schema-example-uv')
  assert.ok(row)
  assert.equal(row.has_experimental, false, 'examples excluded from has_experimental')
  assert.equal(row.has_experimental_example, true)
  assert.ok((index.counts.experimental_examples ?? 0) >= 1)
})

test('quality badge labels', () => {
  assert.equal(qualityBadgeLabel({ quality: 'teaching' }), 'Teaching envelope')
  assert.equal(qualityBadgeLabel({ quality: 'experimental' }), 'Experimental')
  assert.equal(
    qualityBadgeLabel({ quality: 'experimental', example_not_for_citation: true }),
    'Schema example',
  )
})

test('invalid experimental spectrum fails validation', () => {
  const bad = {
    quality: 'teaching',
    display_points: [[1, 2]],
    source: { citation: 'x' },
  }
  const r = validateExperimentalSpectrum(bad)
  assert.equal(r.ok, false)
  assert.ok(r.errors.length > 0)
})
