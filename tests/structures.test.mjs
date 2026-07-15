/**
 * Local SDF structure cache integrity (offline classroom / CI).
 */
import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const primaryDir = path.join(root, 'public', 'structures')
const legacyDir = path.join(root, 'public', 'dataset', 'structures')

/** Known demo CIDs that must be offline-cached for CI/Pages. */
const REQUIRED_CIDS = [
  241, // benzene
  931, // naphthalene
  8418, // anthracene
  6694, // rhodamine-b
  2519, // caffeine
]

const SIZE_WARN_BYTES = 6 * 1024 * 1024

function looksLikeSdf(text) {
  if (!text || text.length < 40) return false
  if (/Status:\s*40[04]/i.test(text)) return false
  return /V2000|V3000|M\s+END/i.test(text)
}

function resolveSdfPath(cid) {
  const a = path.join(primaryDir, `${cid}.sdf`)
  const b = path.join(legacyDir, `${cid}.sdf`)
  if (fs.existsSync(a)) return a
  if (fs.existsSync(b)) return b
  return null
}

function resolveManifest() {
  const a = path.join(primaryDir, 'manifest.json')
  const b = path.join(legacyDir, 'manifest.json')
  if (fs.existsSync(a)) return a
  if (fs.existsSync(b)) return b
  return null
}

test('structure cache directory and manifest exist', () => {
  assert.ok(
    fs.existsSync(primaryDir) || fs.existsSync(legacyDir),
    'public/structures or public/dataset/structures missing — run npm run structures',
  )
  const manifestPath = resolveManifest()
  assert.ok(manifestPath, 'manifest.json missing — run npm run structures')
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
  assert.ok(manifest.count >= 15, `expected ≥15 cached structures, got ${manifest.count}`)
  assert.ok(Array.isArray(manifest.structures))
})

test('local structure files exist for known demo CIDs', () => {
  const missing = []
  for (const cid of REQUIRED_CIDS) {
    const p = resolveSdfPath(cid)
    if (!p) {
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
})

test('structure cache total size is reasonable', () => {
  const manifestPath = resolveManifest()
  assert.ok(manifestPath)
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
  const total = manifest.total_bytes ?? 0
  assert.ok(total > 0, 'manifest total_bytes should be > 0')
  assert.ok(
    total < 8 * 1024 * 1024,
    `structure cache too large: ${(total / (1024 * 1024)).toFixed(2)} MiB`,
  )
  if (total > SIZE_WARN_BYTES) {
    console.warn(
      `WARNING: structure cache ${(total / (1024 * 1024)).toFixed(2)} MiB exceeds soft budget`,
    )
  }
})

test('health.json exists after dataset build', () => {
  const healthPath = path.join(root, 'public', 'health.json')
  assert.ok(fs.existsSync(healthPath), 'public/health.json missing — run npm run dataset')
  const h = JSON.parse(fs.readFileSync(healthPath, 'utf8'))
  assert.equal(h.ok, true)
  assert.ok(typeof h.version === 'string')
  assert.ok(typeof h.full_uvvis === 'number' && h.full_uvvis >= 80)
})
