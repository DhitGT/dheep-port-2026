import { test, expect } from '@playwright/test'

for (const width of [1440, 390]) {
  test(`AI prompt mode supports long English text and separate records at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/')
    await expect(page.locator('#loader')).toBeHidden({ timeout: 15000 })
    await page.getByRole('tab', { name: /Typing Sprint/ }).click()
    await page.getByRole('button', { name: /^AI Prompts/ }).click()
    await page.clock.install({ time: new Date('2026-10-16T00:00:00Z') })
    await page.clock.pauseAt(new Date('2026-10-16T00:00:01Z'))
    await page.getByRole('button', { name: 'Play Typing Sprint', exact: true }).click()
    const game = page.locator('.typing-sprint-game')
    await expect(game).toHaveAttribute('data-mode', 'prompts')
    const field = page.getByRole('textbox', { name: 'Type the highlighted text' })
    const target = (await page.locator('.typing-target-word').getAttribute('aria-label'))!
    expect(target.length).toBeGreaterThan(70)
    expect(target).toMatch(/\.$/)
    await field.pressSequentially(target.slice(0, 40))
    await expect(field).toHaveValue(target.slice(0, 40))
    await expect(page.getByTestId('typing-score')).toHaveText('40')
    if (width < 800) {
      await page.evaluate(() => {
        Object.defineProperty(window.visualViewport!, 'height', { configurable: true, get: () => 400 })
        window.visualViewport!.dispatchEvent(new Event('resize'))
      })
      await expect(game).toHaveClass(/typing-keyboard-open/)
      await field.pressSequentially(target.slice(40, 85))
      const caretVisible = await page.locator('.typing-target-word').evaluate(box => {
        const caret = box.querySelector('.is-caret')!
        const bounds = box.getBoundingClientRect()
        const cursor = caret.getBoundingClientRect()
        return cursor.top >= bounds.top - 1 && cursor.bottom <= bounds.bottom + 1
      })
      expect(caretVisible).toBeTruthy()
      await expect.poll(async () => { const bounds = (await field.boundingBox())!; return bounds.y + bounds.height }).toBeLessThanOrEqual(376)
    }
    await field.fill(target)
    await field.press('Enter')
    await expect(page.getByTestId('typing-score')).toHaveText(String(target.length + 1))
    const next = (await page.locator('.typing-target-word').getAttribute('aria-label'))!
    await field.pressSequentially(next.slice(0, 30))
    await page.clock.fastForward(31000)
    await expect(game).toHaveAttribute('data-phase', 'finished')
    await expect(page.getByTestId('typing-final-score')).toHaveText(String(target.length + 31))
    expect(await page.evaluate(() => Number(localStorage.getItem('portfolio.typing-sprint.prompts.best')))).toBeGreaterThan(0)
    expect(await page.evaluate(() => localStorage.getItem('portfolio.typing-sprint.code.best'))).toBeNull()
    for (const tab of await page.getByRole('tab').all()) await expect(tab).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy()
    await page.locator('.typing-board').screenshot({ path: `../.tools/typing-prompts-result-${width}.png` })
  })
}
