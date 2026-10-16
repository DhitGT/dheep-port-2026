import { test, expect } from '@playwright/test'

for (const width of [1440, 390]) {
  test(`Color Match hides the target, scores five colors and summarizes them at ${width}px`, async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', error => errors.push(error.message))
    await page.setViewportSize({ width, height: 900 })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.addInitScript(() => { Math.random = () => .25 })
    await page.goto('/')
    await expect(page.locator('#loader')).toBeHidden({ timeout: 15000 })
    await page.getByRole('tab', { name: /Color Match/ }).click()
    if (width < 800) await expect(page.locator('.color-board')).toBeHidden()
    await page.clock.install({ time: new Date('2026-10-16T00:00:00Z') })
    await page.clock.pauseAt(new Date('2026-10-16T00:00:01Z'))
    await page.getByRole('button', { name: 'Play Color Match', exact: true }).click()
    const game = page.locator('.color-match-game')
    if (width < 800) await expect(page.locator('.color-menu')).toBeHidden()
    const scores: string[] = []
    const colors = new Set<string>()
    for (let round = 0; round < 5; round++) {
      await expect(game).toHaveAttribute('data-phase', 'memorize')
      await expect(page.getByLabel('Color to memorize', { exact: true })).toBeVisible()
      const target = await page.locator('.color-memory-swatch > div').evaluate(element => (element as HTMLElement).style.backgroundColor)
      colors.add(target)
      await expect(page.getByRole('slider')).toHaveCount(0)
      if (round === 0) {
        await page.clock.fastForward(4900)
        await expect(game).toHaveAttribute('data-phase', 'memorize')
        await page.clock.fastForward(300)
      } else {
        if (round === 1) {
          await page.getByRole('tab', { name: /Physics Lab/ }).click()
          await page.clock.fastForward(6000)
          await page.getByRole('tab', { name: /Color Match/ }).click()
          await expect(game).toHaveAttribute('data-phase', 'memorize')
        }
        await page.clock.fastForward(5200)
      }
      await expect(game).toHaveAttribute('data-phase', 'guess')
      await expect(page.getByLabel('Color to memorize', { exact: true })).toHaveCount(0)
      await expect(page.getByRole('slider')).toHaveCount(4)
      if (round === 0) {
        const values = target.match(/[\d.]+/g)!.map(Number)
        for (const [index, name] of ['Red', 'Green', 'Blue', 'Alpha'].entries()) {
          await page.getByRole('slider', { name, exact: true }).evaluate((element, value) => {
            const input = element as HTMLInputElement
            input.value = String(value)
            input.dispatchEvent(new Event('input', { bubbles: true }))
          }, values[index] ?? 1)
        }
        await page.getByRole('slider', { name: 'Red', exact: true }).press('ArrowRight')
        await page.getByRole('slider', { name: 'Red', exact: true }).press('ArrowLeft')
      }
      await page.getByRole('button', { name: /Submit color/ }).click()
      await expect(game).toHaveAttribute('data-phase', 'result')
      const score = (await page.getByTestId('color-accuracy').textContent())!
      scores.push(score)
      if (round === 0) expect(score).toBe('100.0%')
      await page.getByRole('button', { name: round === 4 ? 'View session summary' : /Next color/ }).click()
    }
    await expect(game).toHaveAttribute('data-phase', 'finished')
    expect(colors.size).toBe(5)
    await expect(page.locator('.color-summary-row')).toHaveCount(5)
    await expect(page.locator('.color-summary-row > strong')).toHaveText(scores)
    const average = Math.round(scores.reduce((total, score) => total + parseFloat(score), 0) / 5 * 10) / 10
    await expect(page.getByTestId('color-average')).toHaveText(`${average.toFixed(1)}%`)
    expect(await page.evaluate(() => Number(localStorage.getItem('portfolio.color-match.best')))).toBe(average)
    for (const tab of await page.getByRole('tab').all()) await expect(tab).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy()
    await page.locator('.color-board').screenshot({ path: `test-results/color-summary-${width}.png` })
    await page.getByRole('button', { name: 'Play 5 new colors' }).click()
    await expect(game).toHaveAttribute('data-phase', 'memorize')
    expect(errors).toEqual([])
  })
}
