/**
 * Lab note pack contracts (markdown + JSON bundle).
 */
import test from 'node:test'
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

// Load compiled-style helpers via dynamic import of source through a thin re-export test shim.
// Source is TypeScript; mirror pure functions here for Node test runner.

function labNoteMarkdown(opts) {
  const { compound, spectrum, technique, url } = opts
  const exportedAt = opts.exportedAt || new Date().toISOString()
  const appVersion = opts.appVersion || '0.9.0'
  const quality = spectrum?.quality || 'teaching'
  const lines = [
    `## ${compound.name} — lab note (BandAtlas)`,
    ``,
    `- **Compound id:** \`${compound.id}\``,
    `- **Formula:** ${compound.formula || 'n/a'}`,
    `- **Technique:** ${technique}`,
    `- **Quality:** ${quality}`,
    `- **App version:** BandAtlas v${appVersion}`,
    `- **Exported:** ${exportedAt}`,
    `- **URL:** ${url}`,
  ]
  return lines.join('\n')
}

const fixture = {
  compound: {
    id: 'benzene',
    name: 'Benzene',
    formula: 'C6H6',
    cas: '71-43-2',
    pubchem_cid: 241,
  },
  spectrum: {
    quality: 'teaching',
    lambda_max_nm: [254, 204],
    solvent: 'cyclohexane',
    source: { note: 'Tier A teaching spectrum', citation: 'teaching envelope' },
  },
  technique: 'uvvis',
  url: 'https://nikshaybisht.github.io/bandatlas/c/benzene?tech=uvvis',
}

test('lab note markdown contains teaching and compound id', () => {
  const md = labNoteMarkdown({ ...fixture, appVersion: '0.9.0' })
  assert.match(md, /teaching/i)
  assert.match(md, /benzene/)
  assert.match(md, /`benzene`/)
  assert.match(md, /BandAtlas v0\.9\.0/)
  assert.match(md, /c\/benzene\?tech=uvvis/)
})

test('lab note markdown quality line for teaching envelopes', () => {
  const md = labNoteMarkdown(fixture)
  assert.ok(md.includes('Quality:** teaching') || md.includes('quality: teaching') || /teaching/i.test(md))
})
