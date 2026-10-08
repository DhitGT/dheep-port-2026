<script setup lang="ts">
import type { SpotifyTrack } from './SpotifyNowPlaying.vue'
const track = ref<SpotifyTrack | null>(null)
const status = ref<'loading' | 'idle' | 'unavailable' | 'disconnected'>('loading')
const collapsed = ref(true)
const compactStatus = computed(() => track.value ? (track.value.isPlaying ? 'Now playing' : 'Paused') : ({ loading: 'Checking Spotify', idle: 'Not playing', unavailable: 'Unavailable', disconnected: 'Not connected' })[status.value])
const compactTitle = computed(() => track.value?.title || 'Spotify')
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
    <button v-if="collapsed" class="spotify-compact" aria-expanded="false" aria-controls="spotify-details" aria-label="Expand Spotify widget" :title="track ? `${track.title} — ${track.artist}` : compactStatus" @click="collapsed = false">
      <i class="fab fa-spotify spotify-compact-icon" aria-hidden="true"></i>
      <span class="spotify-compact-copy"><span class="spotify-compact-status">{{ compactStatus }}</span><span class="spotify-compact-title">{{ compactTitle }}</span></span>
      <span class="spotify-equalizer" :class="{ 'is-playing': track?.isPlaying }" aria-hidden="true"><span></span><span></span><span></span><span></span></span>
      <i class="fas fa-chevron-up spotify-expand-icon" aria-hidden="true"></i>
    </button>
    <button v-else class="spotify-collapse" aria-expanded="true" aria-controls="spotify-details" aria-label="Minimize Spotify widget" @click="collapsed = true"><i class="fas fa-minus" aria-hidden="true"></i></button>
    <div id="spotify-details" v-show="!collapsed"><SpotifyNowPlaying :track="track" :status="status" /></div>
  </aside>
</template>

<style scoped>
.spotify-floating { position: fixed; left: 24px; bottom: 110px; z-index: 80; width: 300px; padding: 18px; border: 1px solid #d4ff0033; border-radius: 12px; background: #0a0a0aee; backdrop-filter: blur(16px); box-shadow: 0 10px 35px #0006; }
.spotify-floating :deep(.spotify-widget) { margin: 0; padding: 0; border: 0; }
.spotify-floating :deep(.spotify-widget > div:first-child) { padding-right: 24px; }
.spotify-collapse { position: absolute; right: 12px; top: 14px; width: 24px; height: 24px; color: #9ca3af; }
.spotify-collapse:hover { color: #d4ff00; }
.spotify-floating.is-collapsed { width: 224px; max-width: calc(100vw - 32px); height: 56px; padding: 0; border-radius: 28px; }
.spotify-compact { display: flex; align-items: center; gap: 12px; width: 100%; height: 100%; padding: 10px 16px; text-align: left; border-radius: inherit; transition: background .2s; }
.spotify-compact:hover { background: #d4ff0008; }
.spotify-compact-icon { font-size: 24px; color: #d4ff00; }
.spotify-compact-copy { flex: 1; min-width: 0; }
.spotify-compact-status { display: block; font: 9px monospace; letter-spacing: 1px; text-transform: uppercase; color: #d4ff00; margin-bottom: 3px; }
.spotify-compact-title { display: block; font-size: 11px; color: #d1d5db; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.spotify-expand-icon { font-size: 8px; color: #6b7280; }
.spotify-equalizer { display: flex; align-items: center; gap: 3px; height: 20px; flex-shrink: 0; color: #6b7280; }
.spotify-equalizer span { width: 3px; height: 14px; border-radius: 2px; background: currentColor; transform: scaleY(.25); }
.spotify-equalizer.is-playing { color: #d4ff00; }
.spotify-equalizer.is-playing span { animation: spotify-bars .8s ease-in-out infinite alternate; }
.spotify-equalizer.is-playing span:nth-child(2) { animation-delay: -.4s; animation-duration: .65s; }
.spotify-equalizer.is-playing span:nth-child(3) { animation-delay: -.2s; animation-duration: .9s; }
.spotify-equalizer.is-playing span:nth-child(4) { animation-delay: -.6s; animation-duration: .75s; }
@keyframes spotify-bars { from { transform: scaleY(.25); } to { transform: scaleY(1); } }
@media (prefers-reduced-motion: reduce) { .spotify-equalizer.is-playing span { animation: none; transform: scaleY(.6); } }
@media (max-width: 767px) { .spotify-floating { left: 16px; bottom: calc(16px + env(safe-area-inset-bottom)); width: min(280px, calc(100vw - 32px)); } }
@media (max-height: 500px) { .spotify-floating { bottom: 16px; } }
</style>
