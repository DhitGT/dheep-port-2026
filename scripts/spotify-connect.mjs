import { createServer } from 'node:http'
import { randomBytes, timingSafeEqual } from 'node:crypto'
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { parseEnv } from 'node:util'

const envPath = new URL('../.env', import.meta.url)
const source = existsSync(envPath) ? readFileSync(envPath, 'utf8') : ''
const settings = { ...parseEnv(source), ...process.env }
const clientId = settings.NUXT_SPOTIFY_CLIENT_ID
const clientSecret = settings.NUXT_SPOTIFY_CLIENT_SECRET
if (!clientId || !clientSecret) {
  console.error('Fill NUXT_SPOTIFY_CLIENT_ID and NUXT_SPOTIFY_CLIENT_SECRET in frontend/.env first.')
  process.exit(1)
}
const redirect = new URL(settings.SPOTIFY_REDIRECT_URI || 'http://127.0.0.1:8989/callback')
if (redirect.protocol !== 'http:' || redirect.hostname !== '127.0.0.1' || !redirect.port || redirect.search || redirect.hash) {
  console.error('The local connection helper requires an explicit http://127.0.0.1:PORT/callback redirect URI.')
  process.exit(1)
}
const state = randomBytes(32).toString('hex')
const authorization = new URL('https://accounts.spotify.com/authorize')
authorization.search = new URLSearchParams({ client_id: clientId, response_type: 'code', redirect_uri: redirect.href, scope: 'user-read-currently-playing user-read-playback-state', state }).toString()
let exchanging = false
const server = createServer(async (request, response) => {
  response.setHeader('Cache-Control', 'no-store')
  response.setHeader('Content-Type', 'text/plain; charset=utf-8')
  const url = new URL(request.url, redirect.origin)
  if (request.method !== 'GET' || url.pathname !== redirect.pathname) { response.writeHead(404); response.end('Not found.'); return }
  const receivedState = Buffer.from(url.searchParams.get('state') || '')
  const expectedState = Buffer.from(state)
  if (receivedState.length !== expectedState.length || !timingSafeEqual(receivedState, expectedState)) {
    response.writeHead(400); response.end('Invalid authorization state.'); return
  }
  if (exchanging) { response.writeHead(409); response.end('Authorization already in progress.'); return }
  if (url.searchParams.has('error') || !url.searchParams.get('code')) {
    response.writeHead(400); response.end('Spotify authorization was not granted. Run the connection command again.');
    finish(1); return
  }
  exchanging = true
  try {
    const result = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: { Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ grant_type: 'authorization_code', code: url.searchParams.get('code'), redirect_uri: redirect.href }),
      signal: AbortSignal.timeout(15000),
    })
    if (!result.ok) throw new Error('Authorization failed')
    const tokens = await result.json()
    if (!tokens.refresh_token) throw new Error('Refresh token missing')
    // Re-read to preserve any other .env edits made during login. Do not print tokens.
    const current = existsSync(envPath) ? readFileSync(envPath, 'utf8') : ''
    const assignment = `NUXT_SPOTIFY_REFRESH_TOKEN=${JSON.stringify(tokens.refresh_token)}`
    const updated = /^NUXT_SPOTIFY_REFRESH_TOKEN=.*$/m.test(current)
      ? current.replace(/^NUXT_SPOTIFY_REFRESH_TOKEN=.*$/m, assignment)
      : `${current.trimEnd()}\n${assignment}\n`
    writeFileSync(envPath, updated, { mode: 0o600 })
    response.end('Spotify connected. You can close this tab and restart the portfolio dev server.')
    console.log('Spotify refresh token saved privately to frontend/.env. Restart npm run dev.')
    finish(0)
  } catch {
    response.writeHead(502); response.end('Could not connect Spotify. Check the app credentials and exact redirect URI, then retry.')
    console.error('Spotify authorization failed. No token was saved.')
    finish(1)
  }
})
const timeout = setTimeout(() => { console.error('Spotify connection timed out. Run the command again.'); finish(1) }, 300000)
function finish(code) { clearTimeout(timeout); server.close(); process.exitCode = code }
server.on('error', () => { console.error('Unable to start the local OAuth callback. Check that the callback port is free.'); finish(1) })
server.listen(Number(redirect.port), '127.0.0.1', () => {
  console.log('Open this URL in your browser and authorize YOUR Spotify account:')
  console.log(authorization.href)
})
