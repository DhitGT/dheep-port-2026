export function createSpotifyService({ fetcher = fetch, now = Date.now } = {}) {
  let token = null
  let cached = null
  let pending = null
  let settingsKey = ''
  let refreshToken = ''
  let retryAt = 0
  async function request(url, options) {
    const response = await fetcher(url, { ...options, signal: AbortSignal.timeout(6000) })
    if (response.status === 429) {
      const seconds = Number(response.headers.get('retry-after')) || 30
      retryAt = now() + Math.max(5, seconds) * 1000
    }
    return response
  }
  async function accessToken(settings) {
    if (token && token.expiresAt > now() + 30000) return token.value
    const response = await request('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: { Authorization: `Basic ${Buffer.from(`${settings.clientId}:${settings.clientSecret}`).toString('base64')}`, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ grant_type: 'refresh_token', refresh_token: refreshToken }),
    })
    if (!response.ok) throw new Error('Spotify authorization unavailable')
    const data = await response.json()
    if (!data.access_token) throw new Error('Missing Spotify token')
    token = { value: data.access_token, expiresAt: now() + Number(data.expires_in || 3600) * 1000 }
    refreshToken = data.refresh_token || refreshToken
    return token.value
  }
  async function load(settings) {
    try {
      let bearer = await accessToken(settings)
      const playback = () => request('https://api.spotify.com/v1/me/player?additional_types=track', { headers: { Authorization: `Bearer ${bearer}` } })
      let response = await playback()
      if (response.status === 401) {
        token = null
        bearer = await accessToken(settings)
        response = await playback()
      }
      if (response.status === 204) return { status: 'idle', track: null }
      if (!response.ok) throw new Error('Spotify playback unavailable')
      const data = await response.json()
      const item = data?.item
      if (data?.device?.is_private_session || !item || item.type !== 'track') return { status: 'idle', track: null }
      return { status: 'ready', track: {
        title: item.name,
        artist: (item.artists || []).map(artist => artist.name).join(', '),
        album: item.album?.name || '',
        image: item.album?.images?.[0]?.url || null,
        url: item.external_urls?.spotify || null,
        durationMs: Math.max(0, Number(item.duration_ms) || 0),
        progressMs: Math.max(0, Number(data.progress_ms) || 0),
        isPlaying: Boolean(data.is_playing),
        fetchedAt: now(),
      } }
    } catch {
      // Do not forward Spotify errors, account details, or credentials to visitors.
      retryAt = Math.max(retryAt, now() + 15000)
      return { status: 'unavailable', track: null }
    }
  }
  return async function getPlayback(settings) {
    if (!settings.clientId || !settings.clientSecret || !settings.refreshToken) return { status: 'disconnected', track: null, retryAfterMs: 30000 }
    const key = JSON.stringify(settings)
    if (settingsKey !== key) {
      settingsKey = key
      refreshToken = settings.refreshToken
      token = cached = null
      retryAt = 0
    }
    if (retryAt > now()) return { status: 'unavailable', track: null, retryAfterMs: retryAt - now() }
    if (cached && now() - cached.at < 5000) return cached.data
    if (!pending) {
      pending = load(settings).then(data => {
        const result = { ...data, retryAfterMs: Math.max(5000, retryAt - now()) }
        cached = { at: now(), data: result }
        return result
      }).finally(() => { pending = null })
    }
    return pending
  }
}
