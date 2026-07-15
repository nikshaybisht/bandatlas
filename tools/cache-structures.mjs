/**
 * Cache PubChem SDF (prefer 3D, fall back to 2D) for offline / rate-limit-safe demos.
 *
 * Output: public/dataset/structures/{cid}.sdf
 *         public/dataset/structures/manifest.json
 *
 * Run:  npm run structures
 * Docs: tools/README-structures.md
 *
 * Does not require a backend. Files are committed for CI/Pages offline demos.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const outDir = path.join(root, 'public', 'dataset', 'structures')
const indexPath = path.join(root, 'public', 'dataset', 'index.json')

/** Soft budget for committed SDF cache (bytes). Warn above this. */
const SIZE_WARN_BYTES = 4 * 1024 * 1024 // 4 MiB

/**
 * Curated offline set: top full-UV teaching compounds + a few majors for demos.
 * Prefer small-ish molecules (skip huge natural products when 3D is huge/missing).
 */
const PRIORITY_IDS = [
  // Classic UV teaching set
  'benzene',
  'naphthalene',
  'anthracene',
  'pyrene',
  'fluorescein',
  'rhodamine-b',
  'methylene-blue',
  'crystal-violet',
  'coumarin-1',
  'tryptophan',
  'riboflavin',
  'caffeine',
  'phenol',
  'aniline',
  'nitrobenzene',
  'acetone',
  'quinine',
  'eosin-y',
  'acridine-orange',
  'curcumin',
  // Extra majors / common lab
  'toluene',
  'adenine',
  'thymine',
  'indigo',
]

function ensureDir(d) {
  fs.mkdirSync(d, { recursive: true })
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

async function fetchText(url) {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'BandAtlas-structure-cache/0.7 (+https://github.com/nikshaybisht/bandatlas)' },
  })
  if (!res.ok) return { ok: false, status: res.status, text: '' }
  const text = await res.text()
  return { ok: true, status: res.status, text }
}

function looksLikeSdf(text) {
  if (!text || text.length < 40) return false
  if (/Status:\s*40[04]/i.test(text)) return false
  if (/<\s*html/i.test(text)) return false
  // SDF typically has "V2000" or "V3000" or M  END
  return /V2000|V3000|M\s+END/i.test(text)
}

async function fetchSdfForCid(cid) {
  const url3d = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${cid}/SDF?record_type=3d`
  const url2d = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${cid}/SDF`

  let r = await fetchText(url3d)
  if (r.ok && looksLikeSdf(r.text)) {
    return { sdf: r.text, record_type: '3d', source: 'pubchem' }
  }
  r = await fetchText(url2d)
  if (r.ok && looksLikeSdf(r.text)) {
    return { sdf: r.text, record_type: '2d', source: 'pubchem' }
  }
  throw new Error(`PubChem SDF unavailable for CID ${cid} (3d/2d failed)`)
}

function loadTargets() {
  /** @type {{ id: string, name: string, pubchem_cid: number }[]} */
  let fromIndex = []
  if (fs.existsSync(indexPath)) {
    const index = JSON.parse(fs.readFileSync(indexPath, 'utf8'))
    const byId = new Map(index.compounds.map((c) => [c.id, c]))
    for (const id of PRIORITY_IDS) {
      const c = byId.get(id)
      if (c?.pubchem_cid) {
        fromIndex.push({ id: c.id, name: c.name, pubchem_cid: c.pubchem_cid })
      }
    }
  }
  // de-dupe by cid
  const seen = new Set()
  const out = []
  for (const t of fromIndex) {
    if (seen.has(t.pubchem_cid)) continue
    seen.add(t.pubchem_cid)
    out.push(t)
  }
  return out
}

async function main() {
  ensureDir(outDir)
  const targets = loadTargets()
  if (targets.length === 0) {
    console.error('No targets found. Run npm run dataset first.')
    process.exit(1)
  }

  console.log(`Caching SDF for ${targets.length} compounds → ${path.relative(root, outDir)}/`)
  const entries = []
  let ok = 0
  let fail = 0

  for (let i = 0; i < targets.length; i++) {
    const t = targets[i]
    const file = `${t.pubchem_cid}.sdf`
    const dest = path.join(outDir, file)
    process.stdout.write(`  [${i + 1}/${targets.length}] ${t.id} (CID ${t.pubchem_cid}) … `)
    try {
      const { sdf, record_type, source } = await fetchSdfForCid(t.pubchem_cid)
      fs.writeFileSync(dest, sdf, 'utf8')
      const bytes = Buffer.byteLength(sdf, 'utf8')
      entries.push({
        id: t.id,
        name: t.name,
        pubchem_cid: t.pubchem_cid,
        file,
        record_type,
        source,
        bytes,
      })
      ok++
      console.log(`${record_type} ${(bytes / 1024).toFixed(1)} KB`)
    } catch (e) {
      fail++
      console.log(`FAIL ${e instanceof Error ? e.message : e}`)
    }
    // Be polite to PubChem
    if (i < targets.length - 1) await sleep(250)
  }

  const totalBytes = entries.reduce((s, e) => s + e.bytes, 0)
  const manifest = {
    version: 1,
    generated_at: new Date().toISOString(),
    count: entries.length,
    total_bytes: totalBytes,
    note: 'Local SDF cache for offline/rate-limit demos. Viewer tries these before PubChem.',
    structures: entries,
  }
  fs.writeFileSync(path.join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n')

  console.log('')
  console.log(`Done: ${ok} cached, ${fail} failed, total ${(totalBytes / 1024).toFixed(1)} KB`)
  if (totalBytes > SIZE_WARN_BYTES) {
    console.warn(
      `WARNING: structure cache is ${(totalBytes / (1024 * 1024)).toFixed(2)} MiB (> ${(SIZE_WARN_BYTES / (1024 * 1024)).toFixed(0)} MiB budget). Consider dropping large CIDs.`,
    )
  }
  if (ok < 5) {
    console.error('ERROR: fewer than 5 structures cached — refusing success.')
    process.exit(1)
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
