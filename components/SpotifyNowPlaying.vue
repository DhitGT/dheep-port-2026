<script setup lang="ts">
export interface SpotifyTrack {
  title: string
  artist: string
  album: string
  image: string | null
  url: string | null
  durationMs: number
  progressMs: number
  isPlaying: boolean
  fetchedAt: number
}
const props = withDefaults(defineProps<{
  track?: SpotifyTrack | null
  status?: 'loading' | 'idle' | 'unavailable' | 'disconnected'
}>(), { track: null, status: 'disconnected' })
const now = ref(0)
let ticker: ReturnType<typeof setInterval> | undefined
onMounted(() => {
  now.value = Date.now()
  ticker = setInterval(() => { now.value = Date.now() }, 1000)
})
onBeforeUnmount(() => clearInterval(ticker))
const elapsed = computed(() => {
  if (!props.track) return 0
  const advance = props.track.isPlaying && now.value ? Math.max(0, now.value - props.track.fetchedAt) : 0
  return Math.min(props.track.durationMs, Math.max(0, props.track.progressMs + advance))
})
const progress = computed(() => props.track?.durationMs ? elapsed.value / props.track.durationMs * 100 : 0)
const formatDuration = (ms: number) => {
  const seconds = Math.max(0, Math.floor(ms / 1000))
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`
}
const emptyMessage = computed(() => ({
  loading: 'Checking the current track…',
  idle: 'No song playing right now.',
  unavailable: 'Listening status is unavailable.',
  disconnected: 'Spotify is not connected yet.',
})[props.status])
</script>

<template>
  <div class="spotify-widget mt-8 pt-6 border-t border-white/10">
    <div class="flex items-center justify-between gap-3 mb-4">
      <a href="https://open.spotify.com/" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-2 text-sm text-gray-300 hover:text-[#d4ff00]" aria-label="Spotify">
        <i class="fab fa-spotify text-xl" aria-hidden="true"></i> Spotify
      </a>
      <span class="text-[10px] font-mono uppercase tracking-widest text-[#d4ff00]">{{ track ? (track.isPlaying ? 'Now playing' : 'Paused') : 'Listening status' }}</span>
    </div>
    <template v-if="track">
      <a v-if="track.url" :href="track.url" target="_blank" rel="noopener noreferrer" class="spotify-track" :aria-label="`Listen to ${track.title} by ${track.artist} on Spotify`">
        <img v-if="track.image" :src="track.image" :alt="`${track.album} album cover`" width="64" height="64" class="spotify-cover">
        <span v-else class="spotify-cover spotify-cover-empty"><i class="fas fa-music" aria-hidden="true"></i></span>
        <span class="min-w-0"><span class="block text-sm font-bold text-white break-words">{{ track.title }}</span><span class="block text-xs text-gray-400 mt-1 break-words">{{ track.artist }}</span></span>
      </a>
      <div v-else class="spotify-track">
        <img v-if="track.image" :src="track.image" :alt="`${track.album} album cover`" width="64" height="64" class="spotify-cover">
        <span class="min-w-0"><span class="block text-sm font-bold text-white break-words">{{ track.title }}</span><span class="block text-xs text-gray-400 mt-1 break-words">{{ track.artist }}</span></span>
      </div>
      <div class="spotify-progress mt-4" role="progressbar" aria-label="Track progress" :aria-valuenow="Math.round(elapsed / 1000)" aria-valuemin="0" :aria-valuemax="Math.ceil(track.durationMs / 1000)" :aria-valuetext="`${formatDuration(elapsed)} of ${formatDuration(track.durationMs)}`">
        <span :style="{ width: `${progress}%` }"></span>
      </div>
      <div class="flex justify-between mt-2 text-[10px] font-mono text-gray-500"><span>{{ formatDuration(elapsed) }}</span><span>{{ formatDuration(track.durationMs) }}</span></div>
    </template>
    <p v-else class="text-xs leading-relaxed text-gray-500" role="status">{{ emptyMessage }}</p>
  </div>
</template>

<style scoped>
.spotify-track { display: flex; align-items: center; gap: 12px; }
.spotify-cover { width: 64px; height: 64px; flex-shrink: 0; object-fit: cover; }
.spotify-cover-empty { display: grid; place-items: center; background: #ffffff08; color: #d4ff00; }
.spotify-progress { height: 3px; background: #ffffff12; overflow: hidden; }
.spotify-progress span { display: block; height: 100%; background: #d4ff00; }
</style>
