import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createSpotifyService } from '../server/utils/spotify-service.mjs'
const settings = { clientId: 'test-client', clientSecret: 'test-secret', refreshToken: 'test-refresh' }
const token = () => Response.json({ access_token: 'test-access', expires_in: 3600 })
const song = (extra = {}) => Response.json({ progress_ms: 42000, is_playing: true, item: { type: 'track', name: 'Test Song', duration_ms: 180000, artists: [{ name: 'Test Artist' }], album: { name: 'Test Album', images: [{ url: 'https://i.scdn.co/test.png' }] }, external_urls: { spotify: 'https://open.spotify.com/track/test' } }, ...extra })
test('missing settings never calls Spotify', async () => {
  const get = createSpotifyService({ fetcher: () => { throw new Error('Unexpected request') } })
  assert.equal((await get({})).status, 'disconnected')
})
test('refresh token stays private and concurrent visitors share the playback request', async () => {
  const calls = []
  const get = createSpotifyService({ now: () => 100000, fetcher: async (url, options) => { calls.push({ url, options }); return url.includes('/api/token') ? token() : song() } })
  const [a, b] = await Promise.all([get(settings), get(settings)])
  assert.deepEqual(a, b)
  assert.equal(calls.length, 2)
  assert.equal(calls[0].options.body.get('grant_type'), 'refresh_token')
  assert.equal(a.track.title, 'Test Song')
  assert.equal(a.track.progressMs, 42000)
  assert.equal(a.track.durationMs, 180000)
  assert.equal(a.track.image, 'https://i.scdn.co/test.png')
  assert.ok(!JSON.stringify(a).includes('test-secret'))
  assert.ok(!JSON.stringify(a).includes('test-access'))
  await get(settings)
  assert.equal(calls.length, 2)
})
test('paused playback is preserved and private sessions, episodes, and 204 are idle', async () => {
  for (const [response, expected] of [[song({ is_playing: false }), 'ready'], [song({ device: { is_private_session: true } }), 'idle'], [song({ item: { type: 'episode' } }), 'idle'], [new Response(null, { status: 204 }), 'idle']]) {
    const get = createSpotifyService({ fetcher: async url => url.includes('/api/token') ? token() : response })
    const result = await get(settings)
    assert.equal(result.status, expected)
    if (expected === 'ready') assert.equal(result.track.isPlaying, false)
    else assert.equal(result.track, null)
  }
})
test('expired authorization is refreshed once and playback retried', async () => {
  let tokens = 0
  let plays = 0
  const get = createSpotifyService({ fetcher: async url => url.includes('/api/token') ? (tokens++, token()) : (++plays === 1 ? new Response(null, { status: 401 }) : song()) })
  assert.equal((await get(settings)).status, 'ready')
  assert.equal(tokens, 2)
  assert.equal(plays, 2)
})
test('rate limits honor Retry-After and API failures do not leak responses', async () => {
  let count = 0
  const get = createSpotifyService({ now: () => 100000, fetcher: async url => { count++; return url.includes('/api/token') ? token() : new Response('secret error', { status: 429, headers: { 'retry-after': '60' } }) } })
  const result = await get(settings)
  assert.equal(result.status, 'unavailable')
  assert.equal(result.retryAfterMs, 60000)
  assert.ok(!JSON.stringify(result).includes('secret error'))
  await get(settings)
  assert.equal(count, 2)
})
