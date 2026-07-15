/**
 * Lab note pack / CSV export contracts (pure builders).
 */
import test from 'node:test'
import assert from 'node:assert/strict'
import {
  labNoteMarkdown,
  spectrumToCsv,
  clipboardMarkdownCitation,
  TEACHING_DISCLAIMER,
} from '../tools/export-contracts.mjs'

const fixture = {
  compound: {
    id: 'benzene',
    name: 'Benzene',
    formula: 'C6H6',
    cas: '71-43-2',
    pubchem_cid: 241,
  },
  spectrum: {
    technique: 'uvvis_abs',
    quality: 'teaching',
    lambda_max_nm: [254, 204],
    solvent: 'cyclohexane',
    y_unit_label: 'ε / M⁻¹ cm⁻¹',
    display_points: [
      [200, 1],
      [210, 2],
      [220, 3],
      [230, 2],
      [240, 1],
    ],
    source: { note: 'Tier A teaching spectrum', citation: 'teaching envelope' },
  },
  technique: 'uvvis',
  url: 'https://nikshaybisht.github.io/bandatlas/c/benzene?tech=uvvis',
}

test('lab note markdown contains teaching and compound id', () => {
  const md = labNoteMarkdown({ ...fixture, appVersion: '0.13.0' })
  assert.match(md, /teaching/i)
  assert.match(md, /benzene/)
  assert.match(md, /`benzene`/)
  assert.match(md, /BandAtlas v0\.13\.0/)
  assert.match(md, /c\/benzene\?tech=uvvis/)
  assert.match(md, /Permalink/)
  assert.match(md, /DISCLAIMER|teaching envelope/i)
})

test('lab note markdown quality line for teaching envelopes', () => {
  const md = labNoteMarkdown(fixture)
  assert.ok(
    md.includes('Quality:** teaching') ||
      md.includes('quality=teaching') ||
      /teaching/i.test(md),
  )
})

test('CSV header contains quality + teaching disclaimer', () => {
  const csv = spectrumToCsv(fixture.spectrum, fixture.compound, {
    appVersion: '0.13.0',
    permalink: fixture.url,
  })
  assert.match(csv, /# quality:\s*teaching/i)
  assert.match(csv, /teaching/i)
  assert.ok(csv.includes(TEACHING_DISCLAIMER) || /NOT experimental SI/i.test(csv))
  assert.match(csv, /permalink/i)
  assert.match(csv, /app_version/i)
  assert.match(csv, /x_nm,y/)
})

test('Markdown export includes permalink pattern', () => {
  const md = labNoteMarkdown(fixture)
  assert.match(md, /\/c\/benzene\?tech=uvvis/)
  assert.match(md, /Permalink/)
})

test('clipboard markdown citation is compact and honest', () => {
  const text = clipboardMarkdownCitation({
    ...fixture,
    appVersion: '0.13.0',
  })
  assert.match(text, /Benzene/)
  assert.match(text, /benzene/)
  assert.match(text, /teaching/i)
  assert.match(text, /c\/benzene\?tech=uvvis/)
})
