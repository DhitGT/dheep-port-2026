<script setup lang="ts">
import type { SpotifyTrack } from './SpotifyNowPlaying.vue'
const track = ref<SpotifyTrack | null>(null)
const status = ref<'loading' | 'idle' | 'unavailable' | 'disconnected'>('loading')
const collapsed = ref(false)
let timer: ReturnType<typeof setTimeout> | undefined
let controller: AbortController | undefined
let stopped = false
async function refresh() {
  clearTimeout(timer)
  if (stopped || document.hidden) return
  let delay = 10000
  controller?.abort()
  controller = new AbortController()
  const signal = controller.signal
  try {
    const data = await $fetch<{ track: SpotifyTrack | null; status: string; retryAfterMs: number }>('/api/spotify/now-playing', { signal, timeout: 10000 })
    if (signal.aborted || stopped) return
    track.value = data.track
    status.value = data.status === 'ready' ? 'idle' : data.status as typeof status.value
    delay = Math.max(5000, data.retryAfterMs || 10000)
  } catch {
    if (stopped || signal.aborted) return
    track.value = null
    status.value = 'unavailable'
    delay = 30000
  }
  if (!stopped) timer = setTimeout(refresh, delay)
}
function visibilityChanged() {
  clearTimeout(timer)
  if (!document.hidden) refresh()
}
onMounted(() => {
  refresh()
  document.addEventListener('visibilitychange', visibilityChanged)
})
onBeforeUnmount(() => {
  stopped = true
  controller?.abort()
  clearTimeout(timer)
  document.removeEventListener('visibilitychange', visibilityChanged)
})
</script>

<template>
  <aside class="spotify-floating hover-trigger" :class="{ 'is-collapsed': collapsed }" aria-label="Spotify listening activity">
    <button class="spotify-collapse" :aria-expanded="!collapsed" :aria-label="collapsed ? 'Expand Spotify widget' : 'Minimize Spotify widget'" @click="collapsed = !collapsed">
      <i :class="collapsed ? 'fab fa-spotify' : 'fas fa-minus'" aria-hidden="true"></i>
    </button>
    <SpotifyNowPlaying v-show="!collapsed" :track="track" :status="status" />
  </aside>
</template>

<style scoped>
.spotify-floating { position: fixed; left: 24px; bottom: 110px; z-index: 80; width: 300px; padding: 18px; border: 1px solid #d4ff0033; border-radius: 12px; background: #0a0a0aee; backdrop-filter: blur(16px); box-shadow: 0 10px 35px #0006; }
.spotify-floating :deep(.spotify-widget) { margin: 0; padding: 0; border: 0; }
.spotify-floating :deep(.spotify-widget > div:first-child) { padding-right: 24px; }
.spotify-collapse { position: absolute; right: 12px; top: 14px; width: 24px; height: 24px; color: #9ca3af; }
.spotify-collapse:hover { color: #d4ff00; }
.spotify-floating.is-collapsed { width: 46px; height: 46px; padding: 0; }
.is-collapsed .spotify-collapse { inset: 0; width: 100%; height: 100%; font-size: 22px; color: #d4ff00; }
@media (max-width: 767px) { .spotify-floating { left: 16px; bottom: calc(16px + env(safe-area-inset-bottom)); width: min(280px, calc(100vw - 32px)); } }
@media (max-height: 500px) { .spotify-floating { bottom: 16px; } }
</style>
