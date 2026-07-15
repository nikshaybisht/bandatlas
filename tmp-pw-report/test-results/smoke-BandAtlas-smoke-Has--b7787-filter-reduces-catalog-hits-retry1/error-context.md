# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: smoke.spec.ts >> BandAtlas smoke >> Has full UV–Vis filter reduces catalog hits
- Location: e2e/smoke.spec.ts:43:3

# Error details

```
Error: expect(locator).toHaveText(expected) failed

Locator: locator('.logo')
Expected: "BandAtlas"
Timeout: 30000ms
Error: element(s) not found

Call log:
  - Expect "toHaveText" with timeout 30000ms
  - waiting for locator('.logo')

```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test'
  2   | 
  3   | /**
  4   |  * Smoke tests — offline-friendly:
  5   |  * - Blocks PubChem so 3D uses local SDF cache only (no network flake).
  6   |  * - Dataset and structures are static under public/.
  7   |  */
  8   | test.describe('BandAtlas smoke', () => {
  9   |   test.beforeEach(async ({ page }) => {
  10  |     // Do not hit PubChem in CI (rate limits / offline). Cached SDFs still load.
  11  |     await page.route('**/pubchem.ncbi.nlm.nih.gov/**', (route) => route.abort())
  12  |     const res = await page.goto('/', { waitUntil: 'networkidle', timeout: 60_000 })
  13  |     expect(res?.ok() || res?.status() === 304).toBeTruthy()
  14  |     // Dataset index must load
> 15  |     await expect(page.locator('.logo')).toHaveText('BandAtlas', { timeout: 30_000 })
      |                                         ^ Error: expect(locator).toHaveText(expected) failed
  16  |     await expect(page.locator('.count-chip')).toContainText(/n\s*=/, { timeout: 30_000 })
  17  |   })
  18  | 
  19  |   test('home loads with shell UI', async ({ page }) => {
  20  |     await expect(page.getByLabel('Search compounds')).toBeVisible()
  21  |     await expect(page.getByRole('tab', { name: 'UV–Vis' })).toBeVisible()
  22  |     // Default compound (rhodamine-b or first UV) should load a plot or empty banner without crash
  23  |     await expect(page.locator('.spectrum-wrap, .banner.error').first()).toBeVisible({
  24  |       timeout: 20_000,
  25  |     })
  26  |   })
  27  | 
  28  |   test('search finds a known full-UV compound', async ({ page }) => {
  29  |     const search = page.getByLabel('Search compounds')
  30  |     await search.click()
  31  |     await search.fill('benzene')
  32  |     const hit = page.locator('.search-hit', { hasText: /Benzene/i }).first()
  33  |     await expect(hit).toBeVisible({ timeout: 10_000 })
  34  |     await hit.click()
  35  |     await expect(page.locator('.property-card h2')).toContainText(/Benzene/i, {
  36  |       timeout: 15_000,
  37  |     })
  38  |     // UV teaching badge or spectrum present
  39  |     await expect(page.locator('.spectrum-wrap')).toBeVisible()
  40  |     await expect(page.locator('.property-card')).toContainText(/Teaching|Full UV|Experimental/i)
  41  |   })
  42  | 
  43  |   test('Has full UV–Vis filter reduces catalog hits', async ({ page }) => {
  44  |     const search = page.getByLabel('Search compounds')
  45  |     const uvFilter = page.getByTestId('filter-uv-only')
  46  | 
  47  |     // Without filter: water is catalog-only (no full UV) — still searchable
  48  |     await search.click()
  49  |     await search.fill('water')
  50  |     // Badge text is adjacent to name ("WaterIR/Ra"), so avoid \b on the full button
  51  |     const waterHit = page
  52  |       .locator('.search-hit')
  53  |       .filter({ has: page.locator('.hit-name', { hasText: 'Water' }) })
  54  |     await expect(waterHit.first()).toBeVisible({ timeout: 10_000 })
  55  |     await expect(waterHit.first().locator('.hit-badge.catalog')).toBeVisible()
  56  |     await expect(waterHit.first().locator('.hit-badge.uv')).toHaveCount(0)
  57  | 
  58  |     // Enable UV filter — water (no has_uvvis) must disappear
  59  |     await uvFilter.check()
  60  |     await search.fill('')
  61  |     await search.fill('water')
  62  |     await expect(page.locator('.search-empty')).toBeVisible({ timeout: 10_000 })
  63  |     await expect(waterHit).toHaveCount(0)
  64  | 
  65  |     // UV discovery still works under the filter
  66  |     await search.fill('')
  67  |     await expect(uvFilter).toBeChecked()
  68  |     await expect(page.locator('.search-hit').first()).toBeVisible({ timeout: 10_000 })
  69  |     const withFilter = await page.locator('.search-hit').count()
  70  |     expect(withFilter).toBeGreaterThan(0)
  71  |     // Every hit shows the UV badge
  72  |     expect(await page.locator('.search-hit .hit-badge.uv').count()).toBe(withFilter)
  73  | 
  74  |     // Known full-UV compound still searchable with filter on
  75  |     await search.fill('benzene')
  76  |     await expect(
  77  |       page.locator('.search-hit').filter({ has: page.locator('.hit-name', { hasText: 'Benzene' }) }),
  78  |     ).toBeVisible()
  79  |   })
  80  | 
  81  |   test('technique tabs switch without crash', async ({ page }) => {
  82  |     const search = page.getByLabel('Search compounds')
  83  |     await search.fill('benzene')
  84  |     await page.locator('.search-hit', { hasText: /Benzene/i }).first().click()
  85  |     await expect(page.locator('.property-card h2')).toContainText(/Benzene/i)
  86  | 
  87  |     for (const name of ['IR', 'Raman', 'UV–Vis'] as const) {
  88  |       const tab = page.getByRole('tab', { name })
  89  |       await tab.click()
  90  |       await expect(tab).toHaveAttribute('aria-selected', 'true')
  91  |       // Plot panel or empty banner still rendered; app shell intact
  92  |       await expect(page.locator('.app')).toBeVisible()
  93  |       await expect(page.locator('.spectrum-wrap')).toBeVisible()
  94  |       await expect(page.locator('.banner.error')).toHaveCount(0)
  95  |     }
  96  |   })
  97  | 
  98  |   test('export CSV triggers a download', async ({ page }) => {
  99  |     const search = page.getByLabel('Search compounds')
  100 |     await search.fill('benzene')
  101 |     await page.locator('.search-hit', { hasText: /Benzene/i }).first().click()
  102 |     await expect(page.locator('.property-card h2')).toContainText(/Benzene/i)
  103 | 
  104 |     // Open Export fold
  105 |     await page.getByRole('button', { name: /Export/i }).click()
  106 |     const csvBtn = page.getByRole('button', { name: 'CSV' })
  107 |     await expect(csvBtn).toBeEnabled({ timeout: 10_000 })
  108 | 
  109 |     const [download] = await Promise.all([
  110 |       page.waitForEvent('download', { timeout: 15_000 }),
  111 |       csvBtn.click(),
  112 |     ])
  113 |     const name = download.suggestedFilename()
  114 |     expect(name).toMatch(/\.csv$/i)
  115 |     expect(name.toLowerCase()).toContain('benzene')
```