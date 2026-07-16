/**
 * URL / DOI allowlist — blocks javascript:/data: and bad DOI shapes.
 */
import test from 'node:test'
import assert from 'node:assert/strict'
import { safeDoiUrl, safeHttpUrl } from '../tools/safe-url.mjs'
import { validateSpectrum } from '../tools/validate-dataset.mjs'

const pts = [
  [200, 1],
  [210, 2],
  [220, 3],
  [230, 2],
  [240, 1],
]

test('safeHttpUrl allows https', () => {
  assert.equal(safeHttpUrl('https://example.com/a'), 'https://example.com/a')
})

test('safeHttpUrl blocks javascript and data', () => {
  assert.equal(safeHttpUrl('javascript:alert(1)'), null)
  assert.equal(safeHttpUrl('data:text/html,<h1>x</h1>'), null)
  assert.equal(safeHttpUrl('vbscript:msgbox'), null)
  assert.equal(safeHttpUrl('file:///etc/passwd'), null)
})

test('safeHttpUrl blocks credentials in URL', () => {
  assert.equal(safeHttpUrl('https://user:pass@evil.com/'), null)
})

test('safeDoiUrl accepts normal DOI', () => {
  const u = safeDoiUrl('10.1111/php.12860')
  assert.equal(u, 'https://doi.org/10.1111/php.12860')
})

test('safeDoiUrl rejects junk', () => {
  assert.equal(safeDoiUrl('not-a-doi'), null)
  assert.equal(safeDoiUrl('10.1/<script>'), null)
  assert.equal(safeDoiUrl('javascript:alert(1)'), null)
})

test('validateSpectrum rejects javascript source.url', () => {
  const errs = validateSpectrum({
    id: 'x',
    technique: 'uvvis_abs',
    quality: 'experimental',
    display_points: pts,
    source: {
      citation: 'c',
      url: 'javascript:alert(1)',
    },
  })
  assert.ok(errs.some((e) => /url|http/i.test(e)))
})

test('validateSpectrum accepts https experimental source', () => {
  const errs = validateSpectrum({
    id: 'x',
    technique: 'uvvis_abs',
    quality: 'experimental',
    display_points: pts,
    source: {
      citation: 'open series',
      url: 'https://example.org/spectrum.csv',
      doi: '10.1000/xyz',
    },
  })
  assert.equal(errs.length, 0, errs.join('; '))
})
