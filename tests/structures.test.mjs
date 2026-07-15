/**
 * Local SDF structure cache integrity.
 */
import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const structuresDir = path.join(root, 'public', 'dataset', 'structures')
const manifestPath = path.join(structuresDir, 'manifest.json')

/** Known demo CIDs that must be offline-cached for CI/Pages. */
const REQUIRED_CIDS = [
  241, // benzene
  931, // naphthalene
  8418, // anthracene
  6694, // rhodamine-b
  2519, // caffeine
]

const SIZE_WARN_BYTES = 4 * 1024 * 1024

function looksLikeSdf(text) {
  if (!text || text.length < 40) return false
  if (/Status:\s*40[04]/i.test(text)) return false
  return /V2000|V3000|M\s+END/i.test(text)
}

test('structure cache directory and manifest exist', () => {
  assert.ok(
    fs.existsSync(structuresDir),
    'public/dataset/structures missing — run npm run structures',
  )
  assert.ok(fs.existsSync(manifestPath), 'manifest.json missing — run npm run structures')
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
  assert.ok(manifest.count >= 5, `expected ≥5 cached structures, got ${manifest.count}`)
  assert.ok(Array.isArray(manifest.structures))
})

test('local structure files exist for at least 5 known CIDs', () => {
  const missing = []
  for (const cid of REQUIRED_CIDS) {
    const p = path.join(structuresDir, `${cid}.sdf`)
    if (!fs.existsSync(p)) {
      missing.push(cid)
      continue
    }
    const text = fs.readFileSync(p, 'utf8')
    assert.ok(looksLikeSdf(text), `CID ${cid} SDF looks invalid`)
  }
  assert.equal(
    missing.length,
    0,
    `missing local SDF for CIDs: ${missing.join(', ')} — run npm run structures`,
  )
  assert.ok(REQUIRED_CIDS.length >= 5)
})

test('structure cache total size is reasonable', () => {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
  const total = manifest.total_bytes ?? 0
  assert.ok(total > 0, 'manifest total_bytes should be > 0')
  // Soft fail as assert: CI should stay under ~6 MiB hard limit
  assert.ok(
    total < 6 * 1024 * 1024,
    `structure cache too large: ${(total / (1024 * 1024)).toFixed(2)} MiB`,
  )
  if (total > SIZE_WARN_BYTES) {
    console.warn(
      `WARNING: structure cache ${(total / (1024 * 1024)).toFixed(2)} MiB exceeds ${SIZE_WARN_BYTES / (1024 * 1024)} MiB soft budget`,
    )
  }
})
