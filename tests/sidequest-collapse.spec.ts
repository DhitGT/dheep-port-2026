import { test, expect } from '@playwright/test'

for (const width of [1440, 390]) {
  test(`side quests start collapsed and expand independently at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/')
    await expect(page.locator('#loader')).toBeHidden({ timeout: 15000 })
    const cards = page.locator('.public-project-card')
    await expect(cards).toHaveCount(5)
    await expect(cards.getByRole('heading')).toHaveText(['KanaLearn', 'dheepASK', 'FOREKS', 'KOPPLING', '1945 WAR GAME'])
    const kanaLearn = cards.first()
    await expect(kanaLearn.locator('.public-project-image')).toHaveAttribute('href', 'https://kanalearn.dheep.site/')
    await expect(kanaLearn.locator('.public-project-badge')).toHaveText('LIVE PROJECT')
    await expect(kanaLearn.getByRole('link', { name: 'View source' })).toHaveCount(0)
    await expect(kanaLearn.locator('.public-project-link')).toHaveAttribute('href', 'https://kanalearn.dheep.site/')
    for (const card of await cards.all()) {
      await expect(card.locator('.public-project-toggle')).toHaveAttribute('aria-expanded', 'false')
      await expect(card.locator('.public-project-details')).toBeHidden()
      await expect(card.getByRole('heading')).toBeVisible()
      await expect(card.locator('.public-project-image')).toBeVisible()
      await expect(card.locator('.public-project-stack')).toBeVisible()
      expect(await card.locator('.public-project-stack span').count()).toBeGreaterThan(0)
    }
    for (const card of await cards.all()) {
      const toggle = card.locator('.public-project-toggle')
      await toggle.click()
      await expect(toggle).toHaveAttribute('aria-expanded', 'true')
      await expect(card.locator('.public-project-details')).toBeVisible()
      await expect(card.locator('.public-project-link').first()).toBeVisible()
      await expect(page.locator('.public-project-toggle[aria-expanded="true"]')).toHaveCount(1)
      await toggle.focus()
      await page.keyboard.press('Enter')
      await expect(card.locator('.public-project-details')).toBeHidden()
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy()
  })
}
