/**
 * UV teaching seed validation.
 */
import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  validateUvSeed,
  loadUvSeedFiles,
  assertValidSeeds,
} from '../tools/validate-seeds.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const examplePath = path.join(root, 'tools', 'fixtures', 'uv-seed.example.json')
const badPath = path.join(root, 'tools', 'fixtures', 'uv-seed.bad.json')

test('example UV seed fixture is valid', () => {
  const seed = JSON.parse(fs.readFileSync(examplePath, 'utf8'))
  const r = validateUvSeed(seed)
  assert.equal(r.ok, true, r.errors.join('; '))
  assert.equal(seed.quality, 'teaching')
  assert.ok(seed.abs.lambda_max_nm.length >= 1)
  assert.ok(seed.abs.lit || seed.abs.quality_note)
})

test('bad UV seed fixture fails validation', () => {
  const seed = JSON.parse(fs.readFileSync(badPath, 'utf8'))
  const r = validateUvSeed(seed)
  assert.equal(r.ok, false)
  assert.ok(r.errors.length >= 3)
})

test('reject experimental quality on teaching seed', () => {
  const seed = JSON.parse(fs.readFileSync(examplePath, 'utf8'))
  seed.quality = 'experimental'
  const r = validateUvSeed(seed)
  assert.equal(r.ok, false)
  assert.ok(r.errors.some((e) => /teaching/i.test(e)))
})

test('reject missing solvent / lambda_max', () => {
  const seed = JSON.parse(fs.readFileSync(examplePath, 'utf8'))
  delete seed.abs.solvent
  seed.abs.lambda_max_nm = []
  const r = validateUvSeed(seed)
  assert.equal(r.ok, false)
  assert.ok(r.errors.some((e) => /solvent/i.test(e)))
  assert.ok(r.errors.some((e) => /lambda_max/i.test(e)))
})

test('data/uv-seeds loads without error (templates skipped)', () => {
  const seeds = loadUvSeedFiles()
  assert.ok(Array.isArray(seeds))
  // _template.json must not be loaded
  assert.ok(!seeds.some((s) => s.id === 'your-compound-id'))
  if (seeds.length) assertValidSeeds(seeds, 'data/uv-seeds test')
})
