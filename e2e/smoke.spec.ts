import { test, expect } from '@playwright/test'

// smoke: block PubChem so 3D uses local SDF only
test.describe('BandAtlas smoke', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/pubchem.ncbi.nlm.nih.gov/**', (route) => route.abort())
    const res = await page.goto('/', { waitUntil: 'networkidle', timeout: 60_000 })
    expect(res?.ok() || res?.status() === 304).toBeTruthy()
    // Dataset index must load
    await expect(page.locator('.logo')).toHaveText('BandAtlas', { timeout: 30_000 })
    await expect(page.locator('.count-chip')).toContainText(/n\s*=/, { timeout: 30_000 })
  })

  test('home loads with shell UI', async ({ page }) => {
    await expect(page.getByLabel('Search compounds')).toBeVisible()
    await expect(page.getByRole('tab', { name: 'UV–Vis' })).toBeVisible()
    // Default compound (rhodamine-b or first UV) should load a plot or empty banner without crash
    await expect(page.locator('.spectrum-wrap, .banner.error').first()).toBeVisible({
      timeout: 20_000,
    })
    await expect(page.getByTestId('featured-strip')).toBeVisible()
    await expect(page.getByTestId('run-60s-tour-nav')).toBeVisible()
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

    for (const name of ['IR', 'Raman', 'UV–Vis', '¹H NMR', '¹³C NMR', 'MS'] as const) {
      const tab = page.getByRole('tab', { name })
      await tab.click()
      await expect(tab).toHaveAttribute('aria-selected', 'true')
      // Plot panel or empty banner still rendered; app shell intact
      await expect(page.locator('.app')).toBeVisible()
      await expect(page.locator('.spectrum-wrap')).toBeVisible()
      await expect(page.locator('.banner.error')).toHaveCount(0)
    }
  })

  test('MS tab shows EI method for benzene', async ({ page }) => {
    const search = page.getByLabel('Search compounds')
    await search.fill('benzene')
    await page.locator('.search-hit', { hasText: /Benzene/i }).first().click()
    await expect(page.locator('.property-card h2')).toContainText(/Benzene/i)
    const msTab = page.getByRole('tab', { name: 'MS', exact: true })
    await msTab.click()
    await expect(msTab).toHaveAttribute('aria-selected', 'true')
    await expect(page.locator('.spectrum-wrap')).toBeVisible()
    // exact: true — "Fluorescein" featured chip also matches name /EI/i
    await expect(page.getByRole('button', { name: 'EI', exact: true })).toBeVisible()
    await expect(page.getByText(/Literature note/i)).toBeVisible()
    await expect(page.getByTestId('error-boundary')).toHaveCount(0)
  })

  test('NMR field toggle switches 60 vs 500 MHz without crash', async ({ page }) => {
    const search = page.getByLabel('Search compounds')
    await search.fill('benzene')
    await page.locator('.search-hit', { hasText: /Benzene/i }).first().click()
    await expect(page.locator('.property-card h2')).toContainText(/Benzene/i)
    const hTab = page.getByRole('tab', { name: '¹H NMR' })
    await hTab.click()
    await expect(hTab).toHaveAttribute('aria-selected', 'true')
    await expect(page.locator('.spectrum-wrap')).toBeVisible()
    await expect(page.getByRole('button', { name: '60 MHz' })).toBeVisible()
    await page.getByRole('button', { name: '60 MHz' }).click()
    await expect(page.getByRole('heading', { name: /60 MHz/i })).toBeVisible()
    await page.getByRole('button', { name: '500 MHz' }).click()
    await expect(page.getByRole('heading', { name: /500 MHz/i })).toBeVisible()
    await expect(page.getByTestId('error-boundary')).toHaveCount(0)
  })

  test('export CSV triggers a download', async ({ page }) => {
    const search = page.getByLabel('Search compounds')
    await search.fill('benzene')
    await page.locator('.search-hit', { hasText: /Benzene/i }).first().click()
    await expect(page.locator('.property-card h2')).toContainText(/Benzene/i)

    // Open Export fold — control must be enabled when a spectrum exists
    const exportToggle = page.getByRole('button', { name: /Export/i })
    await expect(exportToggle).toBeEnabled()
    await exportToggle.click()
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

  test('IR tab switch works after search (PubChem blocked)', async ({ page }) => {
    const search = page.getByLabel('Search compounds')
    await search.fill('benzene')
    await page.locator('.search-hit', { hasText: /Benzene/i }).first().click()
    await expect(page.locator('.property-card h2')).toContainText(/Benzene/i, {
      timeout: 15_000,
    })
    const ir = page.getByRole('tab', { name: 'IR' })
    await ir.click()
    await expect(ir).toHaveAttribute('aria-selected', 'true')
    // Spectrum panel still present; 3D failure must not white-screen
    await expect(page.locator('.spectrum-wrap')).toBeVisible()
    await expect(page.locator('.app')).toBeVisible()
    await expect(page.getByTestId('error-boundary')).toHaveCount(0)
  })

  test('app routes: about, guide, lab, deep link /c/:id', async ({ page }) => {
    const nav = page.getByRole('navigation', { name: 'Primary' })
    await nav.getByRole('link', { name: 'About', exact: true }).click()
    await expect(page.getByRole('heading', { name: /About BandAtlas/i })).toBeVisible()
    await expect(page.getByText(/What it is not/i)).toBeVisible()

    await nav.getByRole('link', { name: 'Guide', exact: true }).click()
    await expect(page.getByRole('heading', { name: /quick guide/i })).toBeVisible()

    await nav.getByRole('link', { name: 'Lab', exact: true }).click()
    await expect(page.locator('.lab-banner')).toBeVisible()
    await expect(page.getByTestId('filter-lab-set')).toBeChecked()
    await expect(page.getByTestId('lab-discussion-card')).toBeVisible({ timeout: 15_000 })
    await expect(page.locator('.property-card h2')).toContainText(/Benzene/i, {
      timeout: 15_000,
    })
    await expect(page.getByTestId('copy-lab-link')).toBeVisible()
    await expect(page.getByTestId('export-lab-note-pack')).toBeVisible()
    // Share path pattern shown in UI
    await expect(page.locator('.lab-card-hint')).toContainText(/\/c\/benzene\?tech=/)

    await page.goto('/c/anthracene?tech=ir', { waitUntil: 'networkidle' })
    await expect(page.locator('.property-card h2')).toContainText(/Anthracene/i, {
      timeout: 15_000,
    })
    await expect(page.getByRole('tab', { name: 'IR' })).toHaveAttribute('aria-selected', 'true')
    await expect(page.locator('.teaching-banner')).toBeVisible()
  })

  test('guide and about pages load', async ({ page }) => {
    await page.goto('/guide', { waitUntil: 'networkidle' })
    await expect(page.getByRole('heading', { name: /quick guide/i })).toBeVisible()
    await expect(page.getByTestId('run-60s-tour')).toBeVisible()
    await expect(page.getByText(/React \+ TypeScript \+ Vite/i)).toBeVisible()
    await expect(page.locator('.page-panel').getByText(/teaching envelopes/i).first()).toBeVisible()

    await page.goto('/about', { waitUntil: 'networkidle' })
    await expect(page.getByTestId('skills-panel')).toBeVisible()
    await expect(page.getByText(/Nikshay Bisht/i)).toBeVisible()
    await expect(page.getByTestId('metrics-grid')).toBeVisible({ timeout: 10_000 })
    await expect(page.locator('.metric-val').first()).not.toHaveText('—', { timeout: 10_000 })
    await expect(page.getByRole('link', { name: /Open instructor pack/i })).toBeVisible()
  })

  test('instructors page loads lecture plan', async ({ page }) => {
    await page.goto('/instructors', { waitUntil: 'networkidle' })
    await expect(page.getByRole('heading', { name: /^Instructors$/i })).toBeVisible()
    await expect(page.getByText(/10 min walkthrough/i)).toBeVisible()
    await expect(page.getByText(/Pin a version/i)).toBeVisible()
  })
})
