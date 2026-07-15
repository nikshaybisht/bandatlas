/**
 * Capture README screenshots (requires preview/dev server).
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

async function pickCompound(page, name) {
  const search = page.getByLabel('Search compounds')
  await search.click()
  await search.fill('')
  await search.fill(name)
  await page.waitForTimeout(700)
  const hit = page.locator('.search-hit', { hasText: new RegExp(name, 'i') }).first()
  if ((await hit.count()) > 0) {
    await hit.click()
    await page.waitForTimeout(1500)
    return true
  }
  // fallback: click any hit
  const any = page.locator('.search-hit').first()
  if ((await any.count()) > 0) {
    await any.click()
    await page.waitForTimeout(1500)
    return true
  }
  return false
}

async function setTheme(page, theme) {
  await page.evaluate((t) => {
    localStorage.setItem('bandatlas-theme', t)
    document.documentElement.dataset.theme = t
    document.body.dataset.theme = t
  }, theme)
  // Prefer clicking the theme button if present
  const btn = page.locator('button.theme-toggle')
  if ((await btn.count()) > 0) {
    const label = await btn.innerText()
    // Button shows the mode you switch TO: "Light" when dark, "Dark" when light
    if (theme === 'light' && /light/i.test(label)) await btn.click()
    if (theme === 'dark' && /dark/i.test(label)) await btn.click()
    await page.waitForTimeout(400)
  }
  await page.reload({ waitUntil: 'networkidle' })
  await page.waitForTimeout(2000)
}

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })

await page.goto(base, { waitUntil: 'networkidle', timeout: 90000 })
await page.waitForTimeout(2500)

// Force dark theme first
await setTheme(page, 'dark')
await pickCompound(page, 'Rhodamine')

// Emission on if available
const em = page.locator('button.emission-toggle')
if ((await em.count()) > 0) {
  const t = await em.innerText()
  if (/off/i.test(t)) await em.click()
  await page.waitForTimeout(800)
}

await shot(page, 'screenshot-uvvis.png')

// IR
const ir = page.getByRole('tab', { name: 'IR' })
if ((await ir.count()) > 0) {
  await ir.click()
  await page.waitForTimeout(1000)
  await shot(page, 'screenshot-ir.png')
}

// Raman
const raman = page.getByRole('tab', { name: 'Raman' })
if ((await raman.count()) > 0) {
  await raman.click()
  await page.waitForTimeout(1000)
  await shot(page, 'screenshot-raman.png')
}

// UV–Vis + overlay
const uv = page.getByRole('tab', { name: 'UV–Vis' })
if ((await uv.count()) > 0) await uv.click()
await page.waitForTimeout(500)
await pickCompound(page, 'Anthracene')
await page.waitForTimeout(800)

const search = page.getByLabel('Search compounds')
await search.click()
await search.fill('benzene')
await page.waitForTimeout(700)
const overlay = page.locator('.hit-overlay').first()
if ((await overlay.count()) > 0) {
  await overlay.click()
  await page.waitForTimeout(1200)
}
await shot(page, 'screenshot-compare.png')

// Light theme hero
await setTheme(page, 'light')
await pickCompound(page, 'Rhodamine')
const em2 = page.locator('button.emission-toggle')
if ((await em2.count()) > 0) {
  const t = await em2.innerText()
  if (/off/i.test(t)) await em2.click()
  await page.waitForTimeout(800)
}
await shot(page, 'screenshot-light.png')

await browser.close()
console.log('done')
