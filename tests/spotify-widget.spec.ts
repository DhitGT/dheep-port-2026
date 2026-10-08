import { test, expect } from '@playwright/test'

for (const width of [1440, 390]) {
  test(`Spotify floating widget shows playback and fits at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.route('**/api/spotify/now-playing', route => route.fulfill({ json: {
      status: 'ready', retryAfterMs: 10000,
      track: { title: 'Test Track', artist: 'Test Artist', album: 'Test Album', image: '/projects/koppling-preview.png', url: 'https://open.spotify.com/track/test', durationMs: 180000, progressMs: 42000, isPlaying: true, fetchedAt: Date.now() },
    } }))
    await page.goto('/')
    await expect(page.locator('#loader')).toBeHidden({ timeout: 15000 })
    const widget = page.getByRole('complementary', { name: 'Spotify listening activity' })
    await expect(widget).toHaveClass(/is-collapsed/)
    await expect(widget.getByRole('progressbar')).toBeHidden()
    await expect(widget.locator('.spotify-equalizer')).toHaveClass(/is-playing/)
    await expect(widget.locator('.spotify-compact-title')).toHaveText('Test Track')
    await widget.getByRole('button', { name: 'Expand Spotify widget' }).click()
    await expect(widget).toContainText('Now playing')
    await expect(widget).toContainText('Test Track')
    await expect(widget).toContainText('Test Artist')
    await expect(widget).toContainText('3:00')
    await expect(widget.getByAltText('Test Album album cover')).toBeVisible()
    await expect(widget.getByRole('link', { name: 'Listen to Test Track by Test Artist on Spotify' })).toHaveAttribute('href', 'https://open.spotify.com/track/test')
    const progress = widget.getByRole('progressbar')
    const initial = Number(await progress.getAttribute('aria-valuenow'))
    await expect.poll(async () => Number(await progress.getAttribute('aria-valuenow'))).toBeGreaterThan(initial)
    const box = (await widget.boundingBox())!
    expect(box.x).toBeGreaterThanOrEqual(0)
    expect(box.x + box.width).toBeLessThanOrEqual(width)
    expect(box.y + box.height).toBeLessThanOrEqual(900)
    await widget.getByRole('button', { name: 'Minimize Spotify widget' }).click()
    await expect(widget.getByRole('progressbar')).toBeHidden()
    await widget.getByRole('button', { name: 'Expand Spotify widget' }).click()
    await expect(widget.getByRole('progressbar')).toBeVisible()
    await widget.screenshot({ path: `test-results/spotify-${width}.png` })
  })
}

test('Spotify disconnected state is honest', async ({ page }) => {
  await page.route('**/api/spotify/now-playing', route => route.fulfill({ json: { status: 'disconnected', track: null, retryAfterMs: 30000 } }))
  await page.goto('/')
  const widget = page.getByRole('complementary', { name: 'Spotify listening activity' })
  await expect(widget.locator('.spotify-compact-status')).toHaveText('Not connected')
  await expect(widget.locator('.spotify-equalizer')).not.toHaveClass(/is-playing/)
  await widget.getByRole('button', { name: 'Expand Spotify widget' }).click()
  await expect(widget).toContainText('Spotify is not connected yet.')
})

test('paused Spotify track freezes elapsed time', async ({ page }) => {
  await page.route('**/api/spotify/now-playing', route => route.fulfill({ json: {
    status: 'ready', retryAfterMs: 10000,
    track: { title: 'Paused Track', artist: 'Test Artist', album: 'Test Album', image: null, url: null, durationMs: 180000, progressMs: 42000, isPlaying: false, fetchedAt: Date.now() - 60000 },
  } }))
  await page.goto('/')
  const widget = page.getByRole('complementary', { name: 'Spotify listening activity' })
  await expect(widget.locator('.spotify-compact-status')).toHaveText('Paused')
  await expect(widget.locator('.spotify-equalizer')).not.toHaveClass(/is-playing/)
  await widget.getByRole('button', { name: 'Expand Spotify widget' }).click()
  await expect(widget).toContainText('Paused')
  await expect(widget.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '42')
  await page.waitForTimeout(1200)
  await expect(widget.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '42')
})
