import { test, expect } from '@playwright/test'
import { readFileSync } from 'node:fs'

const profile: { sphere: string[] } = JSON.parse(readFileSync(new URL('../data/profile.json', import.meta.url), 'utf8'))

for (const width of [1440, 390]) {
  test(`skill mesh connects every node and keeps traffic on its lines at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/')
    await expect(page.locator('#loader')).toBeHidden({ timeout: 15000 })
    const lines = page.locator('.tagcloud-connections line')
    await expect(lines.first()).toBeAttached()
    const connections = await lines.evaluateAll(lines => lines.map(line => ({
      from: (line as SVGElement).dataset.from!, to: (line as SVGElement).dataset.to!, traffic: (line as SVGElement).dataset.traffic
    })))
    expect(connections.length).toBeGreaterThanOrEqual(profile.sphere.length)
    const connected = new Set<string>()
    const pairs = new Set<string>()
    for (const edge of connections) {
      expect(profile.sphere).toContain(edge.from)
      expect(profile.sphere).toContain(edge.to)
      expect(edge.from).not.toBe(edge.to)
      const key = [edge.from, edge.to].sort().join('|')
      expect(pairs.has(key)).toBeFalsy()
      pairs.add(key)
      connected.add(edge.from)
      connected.add(edge.to)
    }
    expect(connected.size).toBe(profile.sphere.length)
    for (const label of profile.sphere) expect(connections.filter(edge => edge.from === label || edge.to === label).length).toBeGreaterThanOrEqual(3)
    const geometry = await page.locator('.tagcloud').evaluate(container => {
      const bounds = container.getBoundingClientRect()
      const nodes = new Map(Array.from(container.querySelectorAll<HTMLElement>('.tagcloud-item')).map(node => [node.textContent, node.getBoundingClientRect()]))
      return Array.from(container.querySelectorAll<SVGLineElement>('line')).every(line => {
        const from = nodes.get(line.dataset.from!)!
        const to = nodes.get(line.dataset.to!)!
        return Math.abs(Number(line.getAttribute('x1')) - (from.x + from.width / 2 - bounds.x)) < 1
          && Math.abs(Number(line.getAttribute('y1')) - (from.y + from.height / 2 - bounds.y)) < 1
          && Math.abs(Number(line.getAttribute('x2')) - (to.x + to.width / 2 - bounds.x)) < 1
          && Math.abs(Number(line.getAttribute('y2')) - (to.y + to.height / 2 - bounds.y)) < 1
      })
    })
    expect(geometry).toBeTruthy()
    const animated = connections.filter(edge => edge.traffic)
    const packets = await page.locator('.tagcloud-packet').evaluateAll(dots => dots.map(dot => ({ from: (dot as SVGElement).dataset.from, to: (dot as SVGElement).dataset.to })))
    expect(packets.length).toBeGreaterThan(0)
    expect(packets.length).toBeLessThanOrEqual(44)
    for (const packet of packets) expect(animated.some(edge => edge.from === packet.from && edge.to === packet.to)).toBeTruthy()
  })
}
