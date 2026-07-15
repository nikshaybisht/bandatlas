/**
 * Capture UI screenshots for README (requires dev/preview server).
 * Usage: node tools/capture-screenshots.mjs [baseUrl]
 */
import { chromium } from 'playwright'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const outDir = path.join(__dirname, '..', 'docs', 'images')
const base = process.argv[2] || 'http://127.0.0.1:4173'

fs.mkdirSync(outDir, { recursive: true })

async function shot(page, name) {
  const file = path.join(outDir, name)
  await page.screenshot({ path: file, fullPage: false })
  console.log('wrote', file)
}

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })

await page.goto(base, { waitUntil: 'networkidle', timeout: 60000 })
await page.waitForTimeout(2500)

// Default (rhodamine UV)
await shot(page, 'screenshot-uvvis.png')

// IR tab
const ir = page.getByRole('tab', { name: 'IR' })
if (await ir.count()) {
  await ir.click()
  await page.waitForTimeout(800)
  await shot(page, 'screenshot-ir.png')
}

// Raman
const raman = page.getByRole('tab', { name: 'Raman' })
if (await raman.count()) {
  await raman.click()
  await page.waitForTimeout(600)
  await shot(page, 'screenshot-raman.png')
}

// Search benzene + overlay anthracene-ish
await page.getByRole('tab', { name: 'UV–Vis' }).click().catch(() => {})
await page.waitForTimeout(400)
const search = page.getByLabel('Search compounds')
await search.fill('anthracene')
await page.waitForTimeout(600)
const anth = page.getByRole('button', { name: /Anthracene/i }).first()
if (await anth.count()) {
  await anth.click()
  await page.waitForTimeout(1200)
}
await search.fill('benzene')
await page.waitForTimeout(500)
const overlay = page.getByRole('button', { name: 'Overlay' }).first()
if (await overlay.count()) {
  await overlay.click()
  await page.waitForTimeout(1000)
  await shot(page, 'screenshot-compare.png')
}

await browser.close()
console.log('done')
