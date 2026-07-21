/**
 * Dataset backend schema — compounds, index flags, summary API.
 */
import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  validateCompoundRecord,
  validateIndexEntry,
  validateSpectrum,
  validateSummary,
  validateDatasetTree,
} from '../tools/validate-dataset.mjs'
import { hasFullUvVis } from '../tools/quality-helpers.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const datasetDir = path.join(root, 'public', 'dataset')

test('validateSpectrum rejects bad quality enum', () => {
  const bad = validateSpectrum({
    id: 'x',
    technique: 'uvvis_abs',
    quality: 'guessed',
    display_points: [
      [1, 1],
      [2, 2],
      [3, 3],
      [4, 4],
      [5, 5],
    ],
    source: { citation: 'c' },
  })
  assert.ok(bad.some((e) => /quality/.test(e)))
})

test('validateSpectrum accepts teaching with source + series', () => {
  const bad = validateSpectrum({
    id: 'x-abs',
    technique: 'uvvis_abs',
    quality: 'teaching',
    display_points: [
      [200, 1],
      [210, 2],
      [220, 3],
      [230, 2],
      [240, 1],
    ],
    source: { citation: 'teaching envelope', note: 'Tier A' },
    lambda_max_nm: [220],
  })
  assert.equal(bad.length, 0)
})

test('validateCompoundRecord requires flags and consistency', () => {
  const base = {
    id: 'demo-mol',
    name: 'Demo',
    formula: 'C6H6',
    family: 'aromatic-hydrocarbons',
    class_labels: ['aromatic-hydrocarbons'],
    lab_set: true,
    spectra: [
      {
        id: 'demo-abs',
        technique: 'uvvis_abs',
        quality: 'teaching',
        display_points: [
          [1, 1],
          [2, 2],
          [3, 3],
          [4, 4],
          [5, 5],
        ],
        source: { citation: 'lit λmax teaching' },
      },
      {
        id: 'demo-ir',
        technique: 'ir',
        quality: 'teaching',
        display_points: [
          [1, 1],
          [2, 2],
          [3, 3],
          [4, 4],
          [5, 5],
        ],
        source: { citation: 'group freq teaching' },
      },
      {
        id: 'demo-ra',
        technique: 'raman',
        quality: 'teaching',
        display_points: [
          [1, 1],
          [2, 2],
          [3, 3],
          [4, 4],
          [5, 5],
        ],
        source: { citation: 'raman teaching' },
      },
    ],
    availability: { uvvis_abs: true, fluorescence: false, ir: true, raman: true },
    flags: {
      hasFullUvVis: true,
      hasIr: true,
      hasRaman: true,
      hasFluorescence: false,
      hasNmr1h: false,
      hasNmr13c: false,
    },
  }
  const ok = validateCompoundRecord(base)
  assert.equal(ok.ok, true, ok.errors.join('; '))

  const badFlags = validateCompoundRecord({
    ...base,
    flags: {
      hasFullUvVis: false,
      hasIr: true,
      hasRaman: true,
      hasNmr1h: false,
      hasNmr13c: false,
    },
  })
  assert.equal(badFlags.ok, false)
})

test('validateIndexEntry requires build flags', () => {
  const r = validateIndexEntry({
    id: 'benzene',
    name: 'Benzene',
    formula: 'C6H6',
    hasFullUvVis: true,
    has_uvvis: true,
    hasIr: true,
    has_ir: true,
    hasRaman: true,
    has_raman: true,
    lab_set: true,
  })
  assert.equal(r.ok, true, r.errors.join('; '))
})

test('validateSummary requires generatedAt and full_uvvis ≥ 80', () => {
  const bad = validateSummary({
    version: '0.11.0',
    total: 10,
    full_uvvis: 50,
    ir: 10,
    raman: 10,
    catalog_only: 0,
    lab_set: 5,
  })
  assert.equal(bad.ok, false)

  const good = validateSummary({
    version: '0.11.0',
    total: 496,
    full_uvvis: 103,
    ir: 496,
    raman: 496,
    catalog_only: 393,
    lab_set: 35,
    generatedAt: '2026-07-16T00:00:00.000Z',
  })
  assert.equal(good.ok, true, good.errors.join('; '))
})

test('built dataset tree validates', () => {
  const r = validateDatasetTree(datasetDir)
  assert.equal(r.ok, true, r.errors.slice(0, 15).join('\n'))
})

test('summary.json counts match index and has generatedAt', () => {
  const summary = JSON.parse(fs.readFileSync(path.join(datasetDir, 'summary.json'), 'utf8'))
  const index = JSON.parse(fs.readFileSync(path.join(datasetDir, 'index.json'), 'utf8'))
  assert.ok(summary.generatedAt || summary.generated_at)
  assert.equal(summary.total, index.compounds.length)
  assert.equal(summary.total, index.counts.total)
  const full = index.compounds.filter((c) => hasFullUvVis(c)).length
  assert.equal(summary.full_uvvis, full)
  assert.ok(summary.full_uvvis >= 80)
  const lab = index.compounds.filter((c) => c.lab_set || c.labSet).length
  assert.equal(summary.lab_set ?? summary.lab_set_count, lab)
  assert.equal(summary.catalog_only, index.compounds.length - full)
})

test('every labSet has hasFullUvVis true (flags only)', () => {
  const index = JSON.parse(fs.readFileSync(path.join(datasetDir, 'index.json'), 'utf8'))
  const lab = index.compounds.filter((c) => c.lab_set || c.labSet)
  assert.ok(lab.length >= 20)
  for (const c of lab) {
    assert.equal(hasFullUvVis(c), true, `${c.id} lab without full UV flag`)
    assert.equal(c.hasFullUvVis ?? c.has_uvvis, true)
    const file = path.join(datasetDir, 'compounds', `${c.id}.json`)
    const rec = JSON.parse(fs.readFileSync(file, 'utf8'))
    assert.equal(rec.flags.hasFullUvVis, true)
    assert.equal(rec.lab_set || rec.labSet, true)
  }
})

test('hasFullUvVis helper does not invent from tier alone', () => {
  assert.equal(hasFullUvVis({ tier: 'full' }), false)
  assert.equal(hasFullUvVis({ hasFullUvVis: true }), true)
  assert.equal(hasFullUvVis({ has_uvvis: false, tier: 'full' }), false)
})
