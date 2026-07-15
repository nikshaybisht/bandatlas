import { test, expect } from '@playwright/test'

/**
 * Smoke tests — offline-friendly:
 * - Blocks PubChem so 3D uses local SDF cache only (no network flake).
 * - Dataset and structures are static under public/.
 */
test.describe('BandAtlas smoke', () => {
  test.beforeEach(async ({ page }) => {
    // Do not hit PubChem in CI (rate limits / offline). Cached SDFs still load.
    await page.route('**/pubchem.ncbi.nlm.nih.gov/**', (route) => route.abort())
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    // Dataset index must load
    await expect(page.locator('.logo')).toHaveText('BandAtlas')
    await expect(page.locator('.count-chip')).toContainText(/n\s*=/, { timeout: 20_000 })
  })

  test('home loads with shell UI', async ({ page }) => {
    await expect(page.getByLabel('Search compounds')).toBeVisible()
    await expect(page.getByRole('tab', { name: 'UV–Vis' })).toBeVisible()
    // Default compound (rhodamine-b or first UV) should load a plot or empty banner without crash
    await expect(page.locator('.spectrum-wrap, .banner.error').first()).toBeVisible({
      timeout: 20_000,
    })
  })

  test('search finds a known full-UV compound', async ({ page }) => {
    const search = page.getByLabel('Search compounds')
    await search.click()
    await search.fill('benzene')
    const hit = page.locator('.search-hit', { hasText: /Benzene/i }).first()
    await expect(hit).toBeVisible({ timeout: 10_000 })
    await hit.click()
    await expect(page.locator('.property-card h2')).toContainText(/Benzene/i, {
      timeout: 15_000,
    })
    // UV teaching badge or spectrum present
    await expect(page.locator('.spectrum-wrap')).toBeVisible()
    await expect(page.locator('.property-card')).toContainText(/Teaching|Full UV|Experimental/i)
  })

  test('Has full UV–Vis filter reduces catalog hits', async ({ page }) => {
    const search = page.getByLabel('Search compounds')
    const uvFilter = page.getByTestId('filter-uv-only')

    // Without filter: water is catalog-only (no full UV) — still searchable
    await search.click()
    await search.fill('water')
    // Badge text is adjacent to name ("WaterIR/Ra"), so avoid \b on the full button
    const waterHit = page
      .locator('.search-hit')
      .filter({ has: page.locator('.hit-name', { hasText: 'Water' }) })
    await expect(waterHit.first()).toBeVisible({ timeout: 10_000 })
    await expect(waterHit.first().locator('.hit-badge.catalog')).toBeVisible()
    await expect(waterHit.first().locator('.hit-badge.uv')).toHaveCount(0)

    // Enable UV filter — water (no has_uvvis) must disappear
    await uvFilter.check()
    await search.fill('')
    await search.fill('water')
    await expect(page.locator('.search-empty')).toBeVisible({ timeout: 10_000 })
    await expect(waterHit).toHaveCount(0)

    // UV discovery still works under the filter
    await search.fill('')
    await expect(uvFilter).toBeChecked()
    await expect(page.locator('.search-hit').first()).toBeVisible({ timeout: 10_000 })
    const withFilter = await page.locator('.search-hit').count()
    expect(withFilter).toBeGreaterThan(0)
    // Every hit shows the UV badge
    expect(await page.locator('.search-hit .hit-badge.uv').count()).toBe(withFilter)

    // Known full-UV compound still searchable with filter on
    await search.fill('benzene')
    await expect(
      page.locator('.search-hit').filter({ has: page.locator('.hit-name', { hasText: 'Benzene' }) }),
    ).toBeVisible()
  })

  test('technique tabs switch without crash', async ({ page }) => {
    const search = page.getByLabel('Search compounds')
    await search.fill('benzene')
    await page.locator('.search-hit', { hasText: /Benzene/i }).first().click()
    await expect(page.locator('.property-card h2')).toContainText(/Benzene/i)

    for (const name of ['IR', 'Raman', 'UV–Vis'] as const) {
      const tab = page.getByRole('tab', { name })
      await tab.click()
      await expect(tab).toHaveAttribute('aria-selected', 'true')
      // Plot panel or empty banner still rendered; app shell intact
      await expect(page.locator('.app')).toBeVisible()
      await expect(page.locator('.spectrum-wrap')).toBeVisible()
      await expect(page.locator('.banner.error')).toHaveCount(0)
    }
  })

  test('export CSV triggers a download', async ({ page }) => {
    const search = page.getByLabel('Search compounds')
    await search.fill('benzene')
    await page.locator('.search-hit', { hasText: /Benzene/i }).first().click()
    await expect(page.locator('.property-card h2')).toContainText(/Benzene/i)

    // Open Export fold
    await page.getByRole('button', { name: /Export/i }).click()
    const csvBtn = page.getByRole('button', { name: 'CSV' })
    await expect(csvBtn).toBeEnabled({ timeout: 10_000 })

    const [download] = await Promise.all([
      page.waitForEvent('download', { timeout: 15_000 }),
      csvBtn.click(),
    ])
    const name = download.suggestedFilename()
    expect(name).toMatch(/\.csv$/i)
    expect(name.toLowerCase()).toContain('benzene')
  })
})
