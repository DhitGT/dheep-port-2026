import { createSpotifyService } from '../../utils/spotify-service.mjs'

const getPlayback = createSpotifyService()
export default defineEventHandler(async (event) => {
  setHeader(event, 'Cache-Control', 'no-store')
  const config = useRuntimeConfig(event)
  return getPlayback({
    clientId: config.spotifyClientId,
    clientSecret: config.spotifyClientSecret,
    refreshToken: config.spotifyRefreshToken,
  })
})
