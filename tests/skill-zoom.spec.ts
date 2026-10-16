import { test, expect } from '@playwright/test'
import { readFileSync } from 'node:fs'

const profile: { sphere: string[] } = JSON.parse(readFileSync(new URL('../data/profile.json', import.meta.url), 'utf8'))

for (const width of [1440, 390]) {
  test(`every technology expands into connected child nodes inline at ${width}px`, async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', error => errors.push(error.message))
    await page.setViewportSize({ width, height: 900 })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/')
    await expect(page.locator('#loader')).toBeHidden({ timeout: 15000 })
    for (const skill of profile.sphere) {
      await page.locator('.tagcloud-item').filter({ hasText: new RegExp(`^${skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`) }).focus()
      await page.keyboard.press('Enter')
      await expect(page.locator('.skill-network')).toHaveAttribute('data-selected', skill)
      await expect(page.locator('.skill-child-node')).toHaveCount(4)
      await expect(page.getByRole('dialog')).toHaveCount(0)
      await expect(page.locator('.skill-branch-line')).toHaveCount(4)
      const context = await page.locator('.skill-network').evaluate(container => {
        const bounds = container.getBoundingClientRect()
        const peers = Array.from(container.querySelectorAll<HTMLElement>('.tagcloud-item:not(.skill-focused-node)'))
        const visiblePeers = peers.filter(node => {
          const box = node.getBoundingClientRect()
          return Number(getComputedStyle(node).opacity) > .1 && box.right > bounds.left && box.left < bounds.right && box.bottom > bounds.top && box.top < bounds.bottom
        })
        return {
          count: visiblePeers.length,
          hidden: peers.some(node => node.getAttribute('aria-hidden') === 'true' || getComputedStyle(node).visibility === 'hidden'),
          edges: Array.from(container.querySelectorAll('line[data-from]')).every(line => Number(line.getAttribute('opacity')) > 0)
        }
      })
      expect(context.count).toBeGreaterThanOrEqual(6)
      expect(context.hidden).toBeFalsy()
      expect(context.edges).toBeTruthy()
      await page.locator('.skill-child-node').first().click()
      await expect(page.locator('.skill-zoom-info')).not.toBeEmpty()
      const fits = await page.locator('.skill-network').evaluate(container => {
        const box = container.getBoundingClientRect()
        return Array.from(container.querySelectorAll('.skill-child-node')).every(node => {
          const bounds = node.getBoundingClientRect()
          return bounds.left >= box.left && bounds.right <= box.right && bounds.top >= box.top && bounds.bottom <= box.bottom
        })
      })
      expect(fits).toBeTruthy()
      await page.getByRole('button', { name: 'Zoom out to skill network' }).click()
      await expect(page.locator('.skill-network')).toHaveAttribute('data-zoom', '0.00')
    }
    expect(errors).toEqual([])
  })
}

test('wheel progressively zooms into a node and back out without scrolling the page', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/')
  await expect(page.locator('#loader')).toBeHidden({ timeout: 15000 })
  const node = page.locator('.tagcloud-item').filter({ hasText: /^Nuxt.js$/ })
  await node.focus()
  await node.hover()
  const before = await page.evaluate(() => scrollY)
  await page.mouse.wheel(0, -50)
  await expect(page.locator('.skill-network')).toHaveAttribute('data-selected', 'Nuxt.js')
  await expect(page.locator('.skill-network')).toHaveAttribute('data-zoom', '0.30')
  await page.mouse.wheel(0, -180)
  await expect(page.locator('.skill-child-node')).toHaveCount(4)
  await expect(page.locator('.skill-network')).toHaveAttribute('data-zoom', '1.00')
  expect(await page.evaluate(() => scrollY)).toBe(before)
  await page.mouse.wheel(0, 180)
  await expect(page.locator('.skill-network')).toHaveAttribute('data-zoom', '0.00')
  await expect(page.locator('.skill-child-node')).toHaveCount(0)
  expect(await page.evaluate(() => scrollY)).toBe(before)
})
