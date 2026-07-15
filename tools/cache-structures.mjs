/**
 * Cache PubChem SDF (prefer 3D, fall back to 2D) for offline / rate-limit-safe demos.
 *
 * Outputs (mirrored):
 *   public/structures/{cid}.sdf          ← primary (airplane-mode path)
 *   public/dataset/structures/{cid}.sdf  ← legacy dual path
 *   public/structures/manifest.json
 *   public/dataset/structures/manifest.json
 *
 * Run manually (network required), then commit artifacts:
 *   npm run dataset && npm run structures
 *
 * Targets: all labSet compounds + featured strip IDs (≈20–40).
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const outPrimary = path.join(root, 'public', 'structures')
const outLegacy = path.join(root, 'public', 'dataset', 'structures')
const indexPath = path.join(root, 'public', 'dataset', 'index.json')

const SIZE_WARN_BYTES = 6 * 1024 * 1024 // 6 MiB soft budget
const FETCH_TIMEOUT_MS = 12_000

/** Featured strip (home) — always cache. */
const FEATURED_IDS = [
  'rhodamine-b',
  'benzene',
  'anthracene',
  'fluorescein',
  'chlorophyll-a',
  'acetone',
]

function ensureDir(d) {
  fs.mkdirSync(d, { recursive: true })
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

function looksLikeSdf(text) {
  if (!text || text.length < 40) return false
  if (/Status:\s*40[04]/i.test(text)) return false
  if (/<\s*html/i.test(text)) return false
  return /V2000|V3000|M\s+END/i.test(text)
}

async function fetchText(url, { retries = 1 } = {}) {
  let lastErr = null
  for (let attempt = 0; attempt <= retries; attempt++) {
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS)
    try {
      const res = await fetch(url, {
        signal: ctrl.signal,
        headers: {
          'User-Agent':
            'BandAtlas-structure-cache/0.12 (+https://github.com/nikshaybisht/bandatlas)',
        },
      })
      clearTimeout(timer)
      if (!res.ok) {
        lastErr = new Error(`HTTP ${res.status}`)
        if (attempt < retries && (res.status >= 500 || res.status === 429)) {
          await sleep(500 * (attempt + 1))
          continue
        }
        return { ok: false, status: res.status, text: '' }
      }
      const text = await res.text()
      return { ok: true, status: res.status, text }
    } catch (e) {
      clearTimeout(timer)
      lastErr = e
      if (attempt < retries) {
        await sleep(500 * (attempt + 1))
        continue
      }
    }
  }
  return { ok: false, status: 0, text: '', error: lastErr }
}

async function fetchSdfForCid(cid) {
  const url3d = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${cid}/SDF?record_type=3d`
  const url2d = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${cid}/SDF`

  let r = await fetchText(url3d, { retries: 1 })
  if (r.ok && looksLikeSdf(r.text)) {
    return { sdf: r.text, record_type: '3d', source: 'pubchem' }
  }
  r = await fetchText(url2d, { retries: 1 })
  if (r.ok && looksLikeSdf(r.text)) {
    return { sdf: r.text, record_type: '2d', source: 'pubchem' }
  }
  throw new Error(`PubChem SDF unavailable for CID ${cid}`)
}

function loadTargets() {
  if (!fs.existsSync(indexPath)) {
    console.error('index.json missing — run npm run dataset first')
    process.exit(1)
  }
  const index = JSON.parse(fs.readFileSync(indexPath, 'utf8'))
  const byId = new Map(index.compounds.map((c) => [c.id, c]))

  /** @type {Map<number, { id: string, name: string, pubchem_cid: number, reason: string }>} */
  const byCid = new Map()

  const add = (id, reason) => {
    const c = byId.get(id)
    if (!c?.pubchem_cid) return
    if (byCid.has(c.pubchem_cid)) return
    byCid.set(c.pubchem_cid, {
      id: c.id,
      name: c.name,
      pubchem_cid: c.pubchem_cid,
      reason,
    })
  }

  // All lab set
  for (const c of index.compounds) {
    if (c.lab_set || c.labSet) add(c.id, 'labSet')
  }
  // Featured strip
  for (const id of FEATURED_IDS) add(id, 'featured')

  // Prefer stable sort by id
  return [...byCid.values()].sort((a, b) => a.id.localeCompare(b.id))
}

function writeBoth(file, content) {
  ensureDir(outPrimary)
  ensureDir(outLegacy)
  fs.writeFileSync(path.join(outPrimary, file), content, 'utf8')
  fs.writeFileSync(path.join(outLegacy, file), content, 'utf8')
}

async function main() {
  const targets = loadTargets()
  if (targets.length === 0) {
    console.error('No targets found.')
    process.exit(1)
  }

  console.log(
    `Caching SDF for ${targets.length} compounds (labSet + featured) → public/structures/ + public/dataset/structures/`,
  )

  const entries = []
  let ok = 0
  let fail = 0
  let skippedExisting = 0

  for (let i = 0; i < targets.length; i++) {
    const t = targets[i]
    const file = `${t.pubchem_cid}.sdf`
    const existing = path.join(outPrimary, file)
    const existingLegacy = path.join(outLegacy, file)
    // Re-use existing valid cache when offline rebuilds are partial
    if (fs.existsSync(existing) || fs.existsSync(existingLegacy)) {
      const src = fs.existsSync(existing) ? existing : existingLegacy
      const text = fs.readFileSync(src, 'utf8')
      if (looksLikeSdf(text)) {
        writeBoth(file, text)
        const bytes = Buffer.byteLength(text, 'utf8')
        entries.push({
          id: t.id,
          name: t.name,
          pubchem_cid: t.pubchem_cid,
          file,
          record_type: 'cached',
          source: 'local-reuse',
          reason: t.reason,
          bytes,
        })
        ok++
        skippedExisting++
        console.log(
          `  [${i + 1}/${targets.length}] ${t.id} (CID ${t.pubchem_cid}) … reuse ${(bytes / 1024).toFixed(1)} KB`,
        )
        continue
      }
    }

    process.stdout.write(
      `  [${i + 1}/${targets.length}] ${t.id} (CID ${t.pubchem_cid}) … `,
    )
    try {
      const { sdf, record_type, source } = await fetchSdfForCid(t.pubchem_cid)
      writeBoth(file, sdf)
      const bytes = Buffer.byteLength(sdf, 'utf8')
      entries.push({
        id: t.id,
        name: t.name,
        pubchem_cid: t.pubchem_cid,
        file,
        record_type,
        source,
        reason: t.reason,
        bytes,
      })
      ok++
      console.log(`${record_type} ${(bytes / 1024).toFixed(1)} KB`)
    } catch (e) {
      fail++
      console.log(`FAIL ${e instanceof Error ? e.message : e}`)
    }
    if (i < targets.length - 1) await sleep(280)
  }

  const totalBytes = entries.reduce((s, e) => s + e.bytes, 0)
  const manifest = {
    version: 2,
    generated_at: new Date().toISOString(),
    count: entries.length,
    total_bytes: totalBytes,
    paths: ['public/structures/', 'public/dataset/structures/'],
    note: 'Local SDF cache for offline/rate-limit demos. Viewer tries local before PubChem (timeout + 1 retry).',
    structures: entries,
  }
  const manJson = JSON.stringify(manifest, null, 2) + '\n'
  writeBoth('manifest.json', manJson)

  console.log('')
  console.log(
    `Done: ${ok} cached (${skippedExisting} reused), ${fail} failed, total ${(totalBytes / 1024).toFixed(1)} KB`,
  )
  if (totalBytes > SIZE_WARN_BYTES) {
    console.warn(
      `WARNING: structure cache is ${(totalBytes / (1024 * 1024)).toFixed(2)} MiB`,
    )
  }
  if (ok < 15) {
    console.error('ERROR: fewer than 15 structures cached — lab/featured offline set incomplete.')
    process.exit(1)
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
