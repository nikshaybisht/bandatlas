/**
 * Capture README + Guide screenshots (requires preview/dev server with dataset).
 * Usage: node tools/capture-screenshots.mjs [baseUrl]
 *
 * Writes:
 *   docs/images/screenshot-*.png  (README)
 *   public/images/step-*.png, og-cover.png  (Guide + Open Graph)
 */
import { chromium } from 'playwright'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const docsDir = path.join(__dirname, '..', 'docs', 'images')
const publicDir = path.join(__dirname, '..', 'public', 'images')
const base = process.argv[2] || 'http://127.0.0.1:4173'

fs.mkdirSync(docsDir, { recursive: true })
fs.mkdirSync(publicDir, { recursive: true })

async function shot(page, name, { alsoPublic } = {}) {
  const file = path.join(docsDir, name)
  await page.screenshot({ path: file, fullPage: false })
  console.log('wrote', file)
  if (alsoPublic) {
    const dest = path.join(publicDir, alsoPublic)
    fs.copyFileSync(file, dest)
    console.log('  →', dest)
  }
}

async function dismissWelcome(page) {
  // Welcome card may cover the explorer on first load
  const dismiss = page.getByRole('button', { name: /dismiss|got it|close|skip/i })
  if ((await dismiss.count()) > 0) {
    try {
      await dismiss.first().click({ timeout: 2000 })
      await page.waitForTimeout(400)
    } catch {
      /* ignore */
    }
  }
  // Click outside / escape
  await page.keyboard.press('Escape').catch(() => {})
}

async function pickCompound(page, name) {
  const search = page.getByLabel('Search compounds')
  await search.click()
  await search.fill('')
  await search.fill(name)
  await page.waitForTimeout(900)
  const hit = page.locator('.search-hit', { hasText: new RegExp(name, 'i') }).first()
  if ((await hit.count()) > 0) {
    await hit.click()
    await page.waitForTimeout(1800)
    return true
  }
  const any = page.locator('.search-hit').first()
  if ((await any.count()) > 0) {
    await any.click()
    await page.waitForTimeout(1800)
    return true
  }
  return false
}

async function clickTab(page, name) {
  const tab = page.getByRole('tab', { name, exact: name === 'MS' })
  await tab.click()
  await page.waitForTimeout(1200)
}

async function setTheme(page, theme) {
  await page.evaluate((t) => {
    localStorage.setItem('bandatlas-theme', t)
    document.documentElement.dataset.theme = t
    if (document.body) document.body.dataset.theme = t
  }, theme)
  const btn = page.locator('button.theme-toggle')
  if ((await btn.count()) > 0) {
    const label = await btn.innerText()
    if (theme === 'light' && /light/i.test(label)) await btn.click()
    if (theme === 'dark' && /dark/i.test(label)) await btn.click()
    await page.waitForTimeout(400)
  }
  await page.reload({ waitUntil: 'networkidle' })
  await page.waitForTimeout(2000)
  await dismissWelcome(page)
}

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })

console.log('base', base)
await page.goto(base, { waitUntil: 'networkidle', timeout: 120_000 })
await page.waitForTimeout(2500)
await dismissWelcome(page)

// ── Dark theme hero shots ──────────────────────────────────────────
await setTheme(page, 'dark')
await pickCompound(page, 'Rhodamine')

// Search step (with results open)
{
  const search = page.getByLabel('Search compounds')
  await search.click()
  await search.fill('benzene')
  await page.waitForTimeout(900)
  await shot(page, 'screenshot-search.png', { alsoPublic: 'step-search.png' })
  await search.fill('')
  await page.keyboard.press('Escape')
  await page.waitForTimeout(300)
}

await pickCompound(page, 'Rhodamine')
const em = page.locator('button.emission-toggle')
if ((await em.count()) > 0) {
  const t = await em.innerText()
  if (/off/i.test(t)) await em.click()
  await page.waitForTimeout(900)
}
await clickTab(page, 'UV–Vis')
await shot(page, 'screenshot-uvvis.png', { alsoPublic: 'step-uvvis.png' })
// OG cover = UV–Vis hero
fs.copyFileSync(path.join(docsDir, 'screenshot-uvvis.png'), path.join(publicDir, 'og-cover.png'))
console.log('  →', path.join(publicDir, 'og-cover.png'))

await clickTab(page, 'IR')
await shot(page, 'screenshot-ir.png', { alsoPublic: 'step-ir.png' })

await clickTab(page, 'Raman')
await shot(page, 'screenshot-raman.png')

// NMR + MS use benzene (pilot set)
await pickCompound(page, 'Benzene')
await clickTab(page, '¹H NMR')
// Prefer 500 MHz if toggle present
const mhz500 = page.getByRole('button', { name: '500 MHz' })
if ((await mhz500.count()) > 0) {
  await mhz500.click()
  await page.waitForTimeout(800)
}
await shot(page, 'screenshot-nmr.png', { alsoPublic: 'step-nmr.png' })

await clickTab(page, 'MS')
const eiBtn = page.getByRole('button', { name: 'EI', exact: true })
if ((await eiBtn.count()) > 0) {
  await eiBtn.first().click()
  await page.waitForTimeout(800)
}
await shot(page, 'screenshot-ms.png', { alsoPublic: 'step-ms.png' })

// Overlay / compare
await clickTab(page, 'UV–Vis')
await pickCompound(page, 'Anthracene')
await page.waitForTimeout(800)
const search = page.getByLabel('Search compounds')
await search.click()
await search.fill('benzene')
await page.waitForTimeout(800)
const overlay = page.locator('.hit-overlay').first()
if ((await overlay.count()) > 0) {
  await overlay.click()
  await page.waitForTimeout(1400)
} else {
  // Fallback: some UIs use a compare control on the hit
  const compareBtn = page.locator('.search-hit').filter({ hasText: /Benzene/i }).locator('button').last()
  if ((await compareBtn.count()) > 0) {
    await compareBtn.click().catch(() => {})
    await page.waitForTimeout(1400)
  }
}
await shot(page, 'screenshot-compare.png')

// Export / lab
await page.goto(`${base.replace(/\/$/, '')}/lab?c=benzene&tech=uvvis`, {
  waitUntil: 'networkidle',
  timeout: 90_000,
})
await page.waitForTimeout(2000)
await dismissWelcome(page)
const exportToggle = page.getByRole('button', { name: /Export/i }).first()
if ((await exportToggle.count()) > 0) {
  await exportToggle.click().catch(() => {})
  await page.waitForTimeout(600)
}
await shot(page, 'screenshot-export.png', { alsoPublic: 'step-export.png' })

// Light theme
await page.goto(base, { waitUntil: 'networkidle', timeout: 90_000 })
await page.waitForTimeout(1500)
await setTheme(page, 'light')
await pickCompound(page, 'Rhodamine')
const em2 = page.locator('button.emission-toggle')
if ((await em2.count()) > 0) {
  const t = await em2.innerText()
  if (/off/i.test(t)) await em2.click()
  await page.waitForTimeout(800)
}
await clickTab(page, 'UV–Vis')
await shot(page, 'screenshot-light.png')

await browser.close()
console.log('done — screenshots updated for latest build')
