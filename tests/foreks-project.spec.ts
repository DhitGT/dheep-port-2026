import { test, expect } from '@playwright/test'

for (const width of [1440, 390]) {
  test(`FOREKS project preserves existing entries and fits at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/')
    await expect(page.locator('#loader')).toBeHidden({ timeout: 15000 })
    const card = page.locator('.public-project-card').filter({ has: page.getByRole('heading', { name: 'FOREKS', exact: true }) })
    await card.scrollIntoViewIfNeeded()
    await expect(page.locator('.public-project-card')).toHaveCount(4)
    await expect(page.getByRole('heading', { name: 'dheepASK', exact: true })).toBeAttached()
    await expect(page.getByRole('heading', { name: 'KOPPLING', exact: true })).toBeAttached()
    await expect(card).toContainText('Front-End Developer')
    await expect(card.locator('li')).toHaveCount(5)
    for (const title of ['Institution & Organization Dashboards', 'Member Management', 'Attendance Management', 'Cash Records & Activity Reports', 'Public Organization Profiles']) {
      await expect(card.locator('strong').filter({ hasText: title })).toBeVisible()
    }
    for (const tag of ['Nuxt 2', 'Vue 2', 'JavaScript', 'Vuex', 'Vuetify 2', 'Tailwind CSS 3', 'Axios', 'Quill', 'Vue Carousel']) {
      await expect(card.getByText(tag, { exact: true })).toBeVisible()
    }
    await expect(card.locator('.public-project-link')).toHaveCount(1)
    await expect(card.getByRole('link', { name: 'View source' })).toHaveAttribute('href', 'https://github.com/DhitGT/FOREKS')
    await expect(card.getByRole('link', { name: 'View source' })).toHaveAttribute('rel', 'noopener noreferrer')
    await expect(card.getByRole('link', { name: /Live demo|Play game/ })).toHaveCount(0)
    const image = card.locator('img')
    await image.evaluate((element: HTMLImageElement) => element.decode())
    expect(await image.evaluate((element: HTMLImageElement) => element.naturalWidth === 1280 && element.naturalHeight === 800)).toBeTruthy()
    await expect(image).toHaveAttribute('alt', /FOREKS extracurricular management (application interface|platform project cover)/)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy()
    await page.mouse.move(0, 0)
    await card.screenshot({ path: `test-results/foreks-${width}.png` })
  })
}
