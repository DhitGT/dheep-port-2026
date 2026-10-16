<script setup>
import { randomColor, rgbaAccuracy, formatRGBA, averageAccuracy } from '../utils/colorMatch.js'

const props = defineProps({ active: Boolean })
const emit = defineEmits(['view-change'])
const board = ref(null)
const phase = ref('idle')
const mobilePlaying = ref(false)
const paused = ref(false)
const inView = ref(false)
const pageVisible = ref(true)
const target = ref(null)
const guess = ref({ r: 128, g: 128, b: 128, a: 1 })
const remaining = ref(5000)
const results = ref([])
const best = ref(0)
const round = computed(() => Math.min(5, results.value.length + (phase.value === 'result' || phase.value === 'finished' ? 0 : 1)))
const average = computed(() => averageAccuracy(results.value))
const latest = computed(() => results.value.at(-1))
const running = computed(() => props.active && inView.value && pageVisible.value && !paused.value)
const channels = [
  { key: 'r', name: 'Red', symbol: 'R', max: 255, step: 1, color: '#e6978a' },
  { key: 'g', name: 'Green', symbol: 'G', max: 255, step: 1, color: '#a6c78b' },
  { key: 'b', name: 'Blue', symbol: 'B', max: 255, step: 1, color: '#92b7e1' },
  { key: 'a', name: 'Alpha', symbol: 'A', max: 1, step: .01, color: '#bcb4d7' }
]
let frame
let observer
let lastTick = 0
watch(running, () => { lastTick = performance.now() }, { flush: 'sync' })

function showGame() {
  mobilePlaying.value = true
  paused.value = false
  emit('view-change', true)
  nextTick(() => { if (matchMedia('(max-width: 800px)').matches) board.value?.scrollIntoView({ block: 'start', behavior: 'instant' }) })
}
function menu() {
  paused.value = true
  mobilePlaying.value = false
  emit('view-change', false)
  nextTick(() => board.value?.closest('.arcade-game')?.scrollIntoView({ block: 'start', behavior: 'instant' }))
}
function nextColor() {
  let color = randomColor()
  // Also guarantee distinct rounds with a deterministic fallback for repeated RNG values.
  while (results.value.some(result => formatRGBA(result.target) === formatRGBA(color))) color = { ...color, r: (color.r + 37) % 256 }
  target.value = color
  guess.value = { r: 128, g: 128, b: 128, a: 1 }
  remaining.value = 5000
  phase.value = 'memorize'
  lastTick = performance.now()
}
function start() { results.value = []; nextColor(); showGame() }
function submit() {
  if (phase.value !== 'guess' || !running.value) return
  results.value.push({ target: { ...target.value }, guess: { ...guess.value }, accuracy: rgbaAccuracy(target.value, guess.value) })
  phase.value = 'result'
}
function advance() {
  if (phase.value !== 'result') return
  if (results.value.length < 5) nextColor()
  else {
    phase.value = 'finished'
    if (average.value > best.value) {
      best.value = average.value
      try { localStorage.setItem('portfolio.color-match.best', String(best.value)) } catch {}
    }
  }
}
function visibilityChanged() { pageVisible.value = !document.hidden }
onMounted(() => {
  try { const stored = Number(localStorage.getItem('portfolio.color-match.best')); if (Number.isFinite(stored) && stored >= 0 && stored <= 100) best.value = stored } catch {}
  visibilityChanged()
  document.addEventListener('visibilitychange', visibilityChanged)
  observer = new IntersectionObserver(([entry]) => { inView.value = entry.isIntersecting })
  observer.observe(board.value)
  lastTick = performance.now()
  function tick(now) {
    const delta = Math.max(0, now - lastTick)
    lastTick = now
    if (phase.value === 'memorize' && running.value) {
      remaining.value = Math.max(0, remaining.value - delta)
      if (remaining.value === 0) phase.value = 'guess'
    }
    frame = requestAnimationFrame(tick)
  }
  frame = requestAnimationFrame(tick)
})
onBeforeUnmount(() => { cancelAnimationFrame(frame); observer?.disconnect(); document.removeEventListener('visibilitychange', visibilityChanged) })
</script>

<template>
  <div :class="['arcade-game', 'color-match-game', { 'show-gameplay': mobilePlaying }]" :data-phase="phase">
    <div class="color-game-layout">
      <div class="color-menu">
        <p class="arcade-eyebrow">04 / REMEMBER · MIX · MATCH</p>
        <h3>A good eye.<br><span class="text-[#d4ff00]">A little RGBA.</span></h3>
        <p class="arcade-description">Five colors. Five seconds to remember each one. Then recreate it from memory with the red, green, blue, and alpha sliders.</p>
        <ol class="color-instructions"><li><span>01</span>Study a random color for 5 seconds.</li><li><span>02</span>Mix your answer after the original disappears.</li><li><span>03</span>Submit to reveal your accuracy. Repeat 5 times.</li></ol>
        <p class="arcade-note">Transparency is part of the challenge. The checkerboard helps you judge alpha.</p>
        <dl class="arcade-stats"><div><dt>Best session</dt><dd class="accent">{{ best.toFixed(1) }}<small>%</small></dd></div><div><dt>Colors per session</dt><dd>5</dd></div></dl>
        <div class="flex flex-wrap gap-3"><button type="button" class="arcade-button" @click="phase !== 'idle' && phase !== 'finished' ? showGame() : start()">{{ phase !== 'idle' && phase !== 'finished' ? 'Resume Color Match' : 'Play Color Match' }}</button><button v-if="phase !== 'idle'" type="button" class="arcade-button arcade-button-secondary color-desktop-restart" @click="start">New session</button></div>
      </div>

      <div ref="board" class="color-board">
        <div class="color-game-top"><button type="button" class="color-menu-back" aria-label="Back to Color Match menu" @click="menu">← MENU</button><strong>COLOR MATCH</strong><span>{{ phase === 'finished' ? 'SESSION COMPLETE' : `ROUND ${String(round).padStart(2, '0')} / 05` }}</span></div>
        <template v-if="phase === 'idle'"><div class="color-idle-art" aria-hidden="true"><span></span><span></span><span></span><span></span><span></span></div><p class="color-idle-copy">Your eyes vs. the sliders.</p><p class="arcade-note text-center">No eyedropper. Just color memory.</p></template>

        <template v-else-if="phase === 'memorize'">
          <div class="color-phase-heading"><div><p class="arcade-eyebrow">LOOK CLOSELY</p><h4>Remember this color.</h4></div><span class="color-countdown" aria-label="Seconds to memorize">{{ Math.ceil(remaining / 1000) }}<small>s</small></span></div>
          <div class="color-checker color-memory-swatch" aria-label="Color to memorize"><div :style="{ backgroundColor: formatRGBA(target) }"></div></div>
          <div class="color-memory-track" role="progressbar" aria-label="Memorization time remaining" :aria-valuenow="Math.ceil(remaining / 1000)" :aria-valuemin="0" :aria-valuemax="5"><span :style="{ width: `${remaining / 5000 * 100}%` }"></span></div>
          <p class="arcade-note mt-4">Remember the hue, brightness, and transparency. The color disappears when time is up.</p>
        </template>

        <template v-else-if="phase === 'guess'">
          <div class="color-phase-heading"><div><p class="arcade-eyebrow">FROM MEMORY</p><h4>Make your match.</h4></div><span class="color-round-pill">{{ results.length }} / 5 DONE</span></div>
          <div class="color-checker color-guess-swatch" aria-label="Your mixed color"><div :style="{ backgroundColor: formatRGBA(guess) }"></div></div>
          <p class="color-rgba-code">{{ formatRGBA(guess) }}</p>
          <div class="color-sliders"><label v-for="channel in channels" :key="channel.key" class="color-slider-row"><span :style="{ color: channel.color }">{{ channel.symbol }}</span><input v-model.number="guess[channel.key]" type="range" :aria-label="channel.name" min="0" :max="channel.max" :step="channel.step" :style="{ accentColor: channel.color }"><output>{{ channel.key === 'a' ? guess.a.toFixed(2) : guess[channel.key] }}</output></label></div>
          <button type="button" class="arcade-button color-submit" :disabled="!running" @click="submit">Submit color →</button>
        </template>

        <template v-else-if="phase === 'result'">
          <div class="color-result-head" role="status"><p class="arcade-eyebrow">ROUND {{ results.length }} / 5 · RGBA ACCURACY</p><p class="color-accuracy" data-testid="color-accuracy">{{ latest.accuracy.toFixed(1) }}<small>%</small></p><h4>{{ latest.accuracy >= 95 ? 'An eye for detail.' : latest.accuracy >= 80 ? 'Pretty close!' : latest.accuracy >= 60 ? 'Getting warmer.' : 'A different shade of you.' }}</h4></div>
          <div class="color-comparison"><div><p class="arcade-eyebrow">ORIGINAL</p><div class="color-checker"><div :style="{ backgroundColor: formatRGBA(latest.target) }"></div></div><code>{{ formatRGBA(latest.target) }}</code></div><div><p class="arcade-eyebrow">YOUR MATCH</p><div class="color-checker"><div :style="{ backgroundColor: formatRGBA(latest.guess) }"></div></div><code>{{ formatRGBA(latest.guess) }}</code></div></div>
          <p class="arcade-note mt-4">Score compares all four RGBA channels equally. Identical values score 100%.</p>
          <button type="button" class="arcade-button color-submit" @click="advance">{{ results.length === 5 ? 'View session summary' : 'Next color →' }}</button>
        </template>

        <template v-else-if="phase === 'finished'">
          <div class="color-result-head"><p class="arcade-eyebrow">FIVE COLORS LATER / AVERAGE ACCURACY</p><p class="color-accuracy" data-testid="color-average">{{ average.toFixed(1) }}<small>%</small></p><h4>Your color memory, decoded.</h4></div>
          <div class="color-summary" aria-label="Results for all five colors"><article v-for="(result, index) in results" :key="index" class="color-summary-row"><span class="color-summary-index">0{{ index + 1 }}</span><div class="color-summary-pair"><div><span>ORIGINAL</span><div class="color-checker"><div :style="{ backgroundColor: formatRGBA(result.target) }"></div></div><code>{{ formatRGBA(result.target) }}</code></div><div><span>YOUR MATCH</span><div class="color-checker"><div :style="{ backgroundColor: formatRGBA(result.guess) }"></div></div><code>{{ formatRGBA(result.guess) }}</code></div></div><strong>{{ result.accuracy.toFixed(1) }}<small>%</small></strong></article></div>
          <button type="button" class="arcade-button color-submit" @click="start">Play 5 new colors</button>
        </template>
        <p v-if="paused && phase !== 'idle'" class="arcade-note mt-4">Session paused. Resume from the menu.</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.color-game-layout { display: grid; grid-template-columns: minmax(0, .85fr) minmax(0, 1.15fr); gap: 48px; max-width: 1050px; margin: auto; align-items: start; }
.color-menu { padding-top: 8px; }
.color-instructions { display: grid; gap: 18px; margin: 28px 0; color: #a8b69c; font-size: 12px; line-height: 1.8; }
.color-instructions li { display: flex; gap: 14px; }
.color-instructions span { color: #d4ff0066; font: 10px monospace; padding-top: 4px; }
.arcade-stats dd small { font-size: 12px; }
.color-board { padding: 22px; background: #090d09; border: 1px solid #d4ff0020; border-radius: 12px; min-width: 0; scroll-margin-top: 170px; }
.color-game-top { display: flex; justify-content: space-between; align-items: center; gap: 8px; padding-bottom: 20px; border-bottom: 1px solid #ffffff0d; font: 8px monospace; letter-spacing: 1px; color: #7b8d6b; }
.color-game-top strong { color: #c1cfb3; font-weight: 400; }
.color-menu-back { display: none; color: #a9bb92; padding: 8px 0; }
.color-phase-heading { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin: 24px 0 18px; }
.color-board h4 { font-size: 20px; font-weight: 600; letter-spacing: -.5px; margin-top: 8px; }
.color-countdown { font: 700 32px 'Space Grotesk', sans-serif; color: #d4ff00; }
.color-countdown small { font: 10px monospace; margin-left: 3px; color: #81936e; }
.color-checker { position: relative; overflow: hidden; border-radius: 7px; background-color: #deded8; background-image: conic-gradient(#b6b9b0 25%, transparent 0 50%, #b6b9b0 0 75%, transparent 0); background-size: 20px 20px; }
.color-checker > div { position: absolute; inset: 0; }
.color-memory-swatch { height: 260px; }
.color-guess-swatch { height: 155px; }
.color-memory-track { height: 3px; margin-top: 16px; background: #ffffff0d; }
.color-memory-track > span { display: block; height: 100%; background: #d4ff00aa; }
.color-rgba-code { margin: 12px 0 22px; text-align: center; color: #91a17f; font: 11px monospace; }
.color-sliders { display: grid; gap: 16px; }
.color-slider-row { display: flex; align-items: center; gap: 14px; font: 11px monospace; }
.color-slider-row > span { width: 15px; }
.color-slider-row input { min-width: 0; flex: 1; cursor: ew-resize; height: 24px; }
.color-slider-row output { width: 38px; text-align: right; color: #cad6bc; }
.color-submit { width: 100%; margin-top: 24px; }
.color-round-pill { color: #879a74; font: 8px monospace; white-space: nowrap; }
.color-result-head { padding: 26px 0 22px; text-align: center; }
.color-accuracy { color: #d4ff00; font: 700 clamp(46px, 6vw, 64px) 'Space Grotesk', sans-serif; letter-spacing: -3px; line-height: 1.2; margin: 14px 0 6px; }
.color-accuracy small { font-size: 24px; margin-left: 3px; color: #83986c; }
.color-comparison { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.color-comparison .color-checker { height: 150px; margin-top: 12px; }
.color-comparison code { display: block; color: #94a580; font-size: 9px; margin-top: 12px; overflow-wrap: anywhere; }
.color-summary { display: grid; gap: 16px; }
.color-summary-row { display: flex; align-items: center; gap: 12px; border-top: 1px solid #ffffff0b; padding-top: 16px; }
.color-summary-index { color: #6f835c; font: 9px monospace; }
.color-summary-pair { flex: 1; min-width: 0; display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.color-summary-pair > div { min-width: 0; }
.color-summary-pair span { font: 7px monospace; letter-spacing: 1px; color: #80936c; }
.color-summary-pair .color-checker { height: 42px; margin: 5px 0; }
.color-summary-pair code { display: block; font: 8px monospace; color: #889b74; overflow-wrap: anywhere; line-height: 1.5; }
.color-summary-row > strong { color: #d4ff00; font: 700 17px 'Space Grotesk', sans-serif; white-space: nowrap; }
.color-summary-row > strong small { font-size: 9px; }
.color-idle-art { display: flex; justify-content: center; gap: 4px; padding: 70px 12px 35px; }
.color-idle-art span { width: 50px; height: 130px; border-radius: 25px; background: #adca79; transform: rotate(-12deg); }
.color-idle-art span:nth-child(2) { background: #72bba5; transform: rotate(-6deg); }
.color-idle-art span:nth-child(3) { background: #7c9cbd; transform: rotate(0); }
.color-idle-art span:nth-child(4) { background: #afa0cb; transform: rotate(6deg); }
.color-idle-art span:nth-child(5) { background: #d4ae9b; transform: rotate(12deg); }
.color-idle-copy { color: #dae5cf; font-size: 22px; font-weight: 600; text-align: center; margin: 0 0 12px; }
.color-board > .arcade-note:last-child { padding-bottom: 16px; }
@media (max-width: 800px) {
  .color-game-layout { grid-template-columns: 1fr; gap: 0; }
  .color-board { display: none; padding: 16px 12px; }
  .show-gameplay .color-board { display: block; }
  .show-gameplay .color-menu { display: none; }
  .color-menu-back { display: block; }
  .color-desktop-restart { display: none; }
  .color-phase-heading { margin-top: 20px; }
  .color-board h4 { font-size: 18px; }
  .color-game-top { font-size: 7px; padding-bottom: 10px; }
  .color-memory-swatch { height: 210px; }
  .color-guess-swatch { height: 125px; }
  .color-sliders { gap: 12px; }
  .color-comparison { gap: 10px; }
  .color-comparison .color-checker { height: 110px; }
  .color-summary-row { gap: 8px; }
  .color-summary-row > strong { font-size: 14px; }
}
</style>
