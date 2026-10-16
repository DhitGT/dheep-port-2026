<script setup>
import { createStackMerge, STACK_TIERS as tiers, STACK_WIDTH as W, STACK_HEIGHT as H, STACK_LIMIT } from '../utils/stackMerge.js'

const props = defineProps({ active: Boolean })
const emit = defineEmits(['view-change'])
const mobilePlaying = ref(false)
const board = ref(null)
const canvas = ref(null)
const state = ref('idle')
const paused = ref(false)
const score = ref(0)
const best = ref(0)
const highest = ref(0)
const current = ref(0)
const next = ref(0)
const aim = ref(W / 2)
const ready = ref(false)
const tokenCount = ref(0)
const message = ref('Two matching tokens make one bigger build.')
const loading = ref(true)
const loadError = ref(false)
const inView = ref(true)
const pageVisible = ref(true)
const autoPaused = computed(() => state.value === 'playing' && (!props.active || !inView.value || !pageVisible.value))
let world
let frame
let observer
let disposed = false
let ctx
let particles = []
let reduced = false
const randomTier = () => { const value = Math.random(); return value < .6 ? 0 : value < .9 ? 1 : 2 }

function saveBest() {
  if (score.value <= best.value) return
  best.value = score.value
  try { localStorage.setItem('portfolio.stack-merge.best', String(best.value)) } catch {}
}
function start() {
  if (!world) return
  world.reset()
  score.value = 0
  highest.value = 0
  tokenCount.value = 0
  particles = []
  current.value = randomTier()
  next.value = randomTier()
  aim.value = W / 2
  state.value = 'playing'
  paused.value = false
  ready.value = true
  message.value = 'Build small. Merge big.'
  showGame()
}
function showGame() {
  mobilePlaying.value = true
  paused.value = false
  emit('view-change', true)
  nextTick(() => { if (matchMedia('(max-width: 800px)').matches) board.value?.scrollIntoView({ block: 'start', behavior: 'instant' }) })
}
function menu() {
  if (state.value === 'playing') paused.value = true
  mobilePlaying.value = false
  emit('view-change', false)
  nextTick(() => board.value?.closest('.arcade-game')?.scrollIntoView({ block: 'start', behavior: 'instant' }))
}
function drop() {
  if (state.value !== 'playing' || paused.value || autoPaused.value || !world?.drop(current.value, aim.value)) return
  current.value = next.value
  next.value = randomTier()
  ready.value = false
}
function point(event) {
  const bounds = canvas.value.getBoundingClientRect()
  const radius = tiers[current.value].radius
  aim.value = Math.max(radius + 8, Math.min(W - radius - 8, (event.clientX - bounds.left) / bounds.width * W))
}
function pointerDown(event) {
  if (event.button !== 0) return
  canvas.value.setPointerCapture(event.pointerId)
  point(event)
}
function pointerUp(event) { if (event.button === 0) { point(event); drop() } }
function keyboard(event) {
  if (['ArrowLeft', 'ArrowRight', ' ', 'Enter'].includes(event.key)) event.preventDefault()
  if (event.key === 'ArrowLeft') aim.value = Math.max(36, aim.value - 12)
  else if (event.key === 'ArrowRight') aim.value = Math.min(W - 36, aim.value + 12)
  else if ((event.key === ' ' || event.key === 'Enter') && !event.repeat) drop()
  else if (event.key.toLowerCase() === 'p' && state.value === 'playing') paused.value = !paused.value
}
function paintToken(x, y, tier, angle = 0, alpha = 1) {
  const item = tiers[tier]
  ctx.save()
  ctx.globalAlpha = alpha
  ctx.translate(x, y)
  ctx.rotate(angle)
  ctx.beginPath()
  ctx.arc(0, 0, item.radius, 0, Math.PI * 2)
  ctx.fillStyle = '#0b100c'
  ctx.fill()
  ctx.fillStyle = `${item.color}25`
  ctx.fill()
  ctx.strokeStyle = item.color
  ctx.lineWidth = 1.5
  ctx.stroke()
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillStyle = item.color
  ctx.font = `bold ${Math.max(10, Math.min(24, item.radius * .55))}px monospace`
  ctx.fillText(item.symbol, 0, tier >= 2 ? -5 : 0)
  if (tier >= 2) { ctx.font = '8px monospace'; ctx.fillText(item.name.toUpperCase(), 0, 13) }
  ctx.restore()
}
function draw(delta) {
  ctx.clearRect(0, 0, W, H)
  ctx.fillStyle = '#090d09'
  ctx.fillRect(0, 0, W, H)
  ctx.fillStyle = '#d4ff0010'
  for (let x = 20; x < W; x += 24) for (let y = 16; y < H; y += 24) ctx.fillRect(x, y, 1, 1)
  const tokens = world.tokens()
  const danger = tokens.some(body => body.plugin.danger > 200)
  ctx.strokeStyle = danger ? '#ee9e77' : '#d4ff0030'
  ctx.setLineDash([4, 6])
  ctx.beginPath(); ctx.moveTo(10, STACK_LIMIT); ctx.lineTo(W - 10, STACK_LIMIT); ctx.stroke()
  ctx.setLineDash([])
  ctx.font = '8px monospace'; ctx.fillStyle = danger ? '#ee9e77' : '#717e60'; ctx.textAlign = 'right'
  ctx.fillText('STACK LIMIT', W - 15, STACK_LIMIT - 9)
  ctx.strokeStyle = '#d4ff0033'; ctx.lineWidth = 2
  ctx.beginPath(); ctx.moveTo(5, 0); ctx.lineTo(5, H - 5); ctx.lineTo(W - 5, H - 5); ctx.lineTo(W - 5, 0); ctx.stroke()
  for (const body of tokens) paintToken(body.position.x, body.position.y, body.plugin.tier, body.angle)
  if (state.value === 'idle') {
    paintToken(80, H - 27, 1, -.2, .6); paintToken(160, H - 41, 3, .1, .6); paintToken(270, H - 58, 5, -.1, .6)
  }
  if (state.value === 'playing' && !paused.value) {
    ctx.strokeStyle = '#d4ff0025'; ctx.setLineDash([2, 7]); ctx.beginPath(); ctx.moveTo(aim.value, 62); ctx.lineTo(aim.value, H - 10); ctx.stroke(); ctx.setLineDash([])
    paintToken(aim.value, 38, current.value, 0, ready.value ? .8 : .25)
  }
  particles = particles.filter(particle => particle.life > 0)
  for (const particle of particles) {
    particle.life -= delta
    particle.x += particle.vx * delta / 16.67
    particle.y += particle.vy * delta / 16.67
    ctx.globalAlpha = Math.max(0, particle.life / 450)
    ctx.fillStyle = particle.color
    ctx.fillRect(particle.x, particle.y, 3, 3)
  }
  ctx.globalAlpha = 1
}
function visibilityChanged() { pageVisible.value = !document.hidden }
onMounted(async () => {
  try { const stored = Number(localStorage.getItem('portfolio.stack-merge.best')); if (Number.isFinite(stored) && stored > 0) best.value = stored } catch {}
  reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
  visibilityChanged()
  document.addEventListener('visibilitychange', visibilityChanged)
  try {
    const { default: Matter } = await import('matter-js')
    if (disposed) return
    ctx = canvas.value.getContext('2d')
    const ratio = Math.min(devicePixelRatio || 1, 2)
    canvas.value.width = W * ratio; canvas.value.height = H * ratio
    ctx.scale(ratio, ratio)
    world = createStackMerge(Matter, {
      onMerge(merge) {
        score.value += merge.points
        highest.value = Math.max(highest.value, merge.tier)
        message.value = `Merged ${tiers[merge.tier].name}! +${merge.points}`
        saveBest()
        if (!reduced) for (let i = 0; i < 10; i++) particles.push({ x: merge.x, y: merge.y, vx: (Math.random() - .5) * 3, vy: (Math.random() - .5) * 3, color: tiers[merge.tier].color, life: 450 })
      },
      onEnd(result) { state.value = result; message.value = result === 'won' ? 'Shipped to production. Build complete!' : 'Stack overflow. Time for a fresh build.'; saveBest() }
    })
    loading.value = false
    observer = new IntersectionObserver(([entry]) => { inView.value = entry.isIntersecting })
    observer.observe(board.value)
    let last = performance.now()
    let accumulator = 0
    function tick(now) {
      const delta = Math.min(now - last, 50)
      last = now
      if (props.active && inView.value && pageVisible.value) {
        if (state.value === 'playing' && !paused.value) {
          accumulator += delta
          while (accumulator >= 1000 / 60) { world.step(1000 / 60); accumulator -= 1000 / 60 }
          ready.value = world.ready
          tokenCount.value = world.tokens().length
        } else accumulator = 0
        draw(paused.value ? 0 : delta)
      } else accumulator = 0
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
  } catch { if (!disposed) { loading.value = false; loadError.value = true } }
})
onBeforeUnmount(() => { disposed = true; cancelAnimationFrame(frame); observer?.disconnect(); world?.dispose(); document.removeEventListener('visibilitychange', visibilityChanged) })
</script>

<template>
  <div :class="['arcade-game', 'stack-merge-game', { 'show-gameplay': mobilePlaying }]" :data-state="state" :data-token-count="tokenCount">
    <div class="stack-merge-layout">
      <div class="stack-merge-sidebar">
        <p class="arcade-eyebrow">02 / DROP · MERGE · DEPLOY</p>
        <h3>Small bits.<br><span class="text-[#d4ff00]">Big builds.</span></h3>
        <p class="arcade-description">Drop matching code tokens together to build something bigger. From a tiny Bit to a full Production release. Keep your stack below the line.</p>
        <div class="arcade-mobile-only mt-6"><p class="arcade-note mb-4">9 BUILD LEVELS · BEST SCORE {{ best }}</p><button type="button" class="arcade-button" :disabled="loading || loadError" @click="state === 'playing' ? showGame() : start()">{{ loading ? 'Loading…' : state === 'playing' ? 'Resume Stack Merge' : 'Play Stack Merge' }}</button></div>
        <dl class="arcade-stats"><div><dt>Score</dt><dd class="accent" data-testid="merge-score">{{ score }}</dd></div><div><dt>Best</dt><dd>{{ best }}</dd></div><div><dt>Next drop</dt><dd class="stack-next" :style="{ color: tiers[next].color }">{{ tiers[next].symbol }}</dd></div></dl>
        <div class="stack-controls"><button type="button" class="arcade-button" :disabled="state !== 'playing' || !ready || paused || autoPaused" @click="drop">Drop {{ tiers[current].name }} ↓</button><button type="button" class="arcade-button arcade-button-secondary" :disabled="state !== 'playing'" @click="paused = !paused">{{ paused ? 'Resume' : 'Pause' }}</button><button v-if="state !== 'idle'" type="button" class="stack-reset" aria-label="Restart Stack Merge" @click="start">↻</button></div>
        <p class="arcade-note mt-4">Move or drag to aim. Click / tap to drop.<br>Keyboard: ← → to aim, Space to drop, P to pause.</p>
        <p class="stack-merge-message" role="status">{{ autoPaused ? 'Auto-paused. Come back when you’re ready.' : message }}</p>
        <p class="arcade-eyebrow mt-8 mb-3">THE BUILD PATH</p>
        <ol class="stack-evolution"><li v-for="(tier, index) in tiers" :key="tier.name" :class="{ unlocked: highest >= index }"><span :style="{ color: tier.color, borderColor: `${tier.color}55` }">{{ tier.symbol }}</span><small>{{ tier.name }}</small></li></ol>
      </div>
      <div ref="board" class="stack-board-wrap">
        <div class="arcade-mobile-toolbar">
          <div class="arcade-mobile-topline"><button type="button" aria-label="Back to Stack Merge menu" @click="menu">← MENU</button><strong>STACK MERGE</strong></div>
          <dl class="arcade-mobile-stats"><div><dt>Score</dt><dd data-testid="merge-mobile-score">{{ score }}</dd></div><div><dt>Best</dt><dd>{{ best }}</dd></div><div><dt>Next</dt><dd :style="{ color: tiers[next].color }">{{ tiers[next].symbol }}</dd></div></dl>
          <div class="arcade-mobile-actions"><button type="button" class="arcade-button" :disabled="state !== 'playing' || !ready || paused || autoPaused" @click="drop">Drop {{ tiers[current].name }} ↓</button><button type="button" :disabled="state !== 'playing'" @click="paused = !paused">{{ paused ? 'RESUME' : 'PAUSE' }}</button><button type="button" aria-label="Restart Stack Merge" @click="start">↻ RESTART</button></div>
        </div>
        <div class="stack-board-stage">
        <canvas ref="canvas" class="stack-board" tabindex="0" aria-label="Stack Merge board. Left and right arrows aim, Space or Enter drops a token." @pointermove="point" @pointerdown="pointerDown" @pointerup="pointerUp" @keydown="keyboard">Drop and merge matching code tokens. Use the aim slider and Drop button to play.</canvas>
        <div v-if="state !== 'playing' || paused || loadError" class="stack-overlay">
          <template v-if="loading"><p class="arcade-eyebrow">COMPILING THE PLAYGROUND…</p></template>
          <template v-else-if="loadError"><p>Couldn’t load the game.</p><p class="arcade-note">Refresh the page to try again.</p></template>
          <template v-else-if="paused"><p class="arcade-eyebrow">TAKE YOUR TIME</p><h4>Build paused.</h4><button type="button" class="arcade-button" @click="paused = false">Resume build</button></template>
          <template v-else><span class="stack-overlay-symbol" aria-hidden="true">{{ state === 'won' ? '✓' : state === 'over' ? '!{}' : '</>' }}</span><p class="arcade-eyebrow">{{ state === 'won' ? 'RELEASE COMPLETE' : state === 'over' ? 'BUILD FAILED' : 'A LITTLE CODE. A LOT OF GRAVITY.' }}</p><h4>{{ state === 'won' ? 'Shipped it.' : state === 'over' ? 'Stack overflow.' : 'One more merge?' }}</h4><p class="arcade-note">{{ state === 'idle' ? 'Match two identical tokens. Reach Production.' : `Final score: ${score}` }}</p><button type="button" class="arcade-button mt-5" @click="start">{{ state === 'idle' ? 'Start building' : 'Build again' }}</button></template>
        </div>
        </div>
        <label class="stack-aim-label">AIM<input v-model.number="aim" type="range" min="36" :max="W - 36" aria-label="Drop position"></label>
        <p class="stack-mobile-help arcade-note">Drag to aim · Tap to drop · Match identical tokens.</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.stack-merge-layout { display: grid; grid-template-columns: minmax(0, 1fr) minmax(260px, 400px); gap: 50px; align-items: start; max-width: 1000px; margin: auto; }
.stack-merge-sidebar { padding-top: 12px; }
.stack-controls { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
.stack-reset { color: #889a74; font-size: 24px; padding: 0 8px; }
.stack-merge-message { min-height: 40px; margin-top: 22px; font: 11px monospace; color: #b2c394; line-height: 1.7; }
.stack-evolution { display: grid; grid-template-columns: repeat(5, 1fr); gap: 16px 6px; }
.stack-evolution li { text-align: center; opacity: .4; }
.stack-evolution li.unlocked { opacity: 1; }
.stack-evolution li > span { display: inline-flex; align-items: center; justify-content: center; width: 32px; height: 32px; border: 1px solid; border-radius: 50%; font: bold 9px monospace; }
.stack-evolution small { display: block; margin-top: 6px; color: #9aa78c; font-size: 8px; }
.stack-board-wrap { position: relative; min-width: 0; scroll-margin-top: 80px; }
.stack-board-stage { position: relative; }
.stack-mobile-help { display: none; }
.stack-board { display: block; width: 100%; aspect-ratio: 400 / 520; border-radius: 10px; border: 1px solid #d4ff0027; touch-action: pan-y; cursor: crosshair; }
.stack-overlay { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; text-align: center; background: #080d08b8; padding: 20px; border-radius: 10px; backdrop-filter: blur(3px); }
.stack-overlay h4 { font-size: clamp(24px, 4vw, 32px); font-weight: 700; letter-spacing: -1px; }
.stack-overlay-symbol { color: #d4ff00; font: bold 48px monospace; margin-bottom: 16px; }
.stack-aim-label { display: flex; align-items: center; gap: 12px; height: 34px; font: 8px monospace; letter-spacing: 2px; color: #8b9b77; }
.stack-aim-label input { flex: 1; min-width: 0; accent-color: #d4ff00; cursor: ew-resize; }
@media (max-width: 800px) {
  .stack-merge-layout { grid-template-columns: 1fr; gap: 0; }
  .stack-board-wrap { display: none; width: min(100%, 400px); margin: auto; }
  .stack-board-wrap { scroll-margin-top: 170px; }
  .show-gameplay .stack-board-wrap { display: block; }
  .show-gameplay .stack-merge-sidebar { display: none; }
  .stack-merge-sidebar > .arcade-stats, .stack-controls, .stack-merge-sidebar > .arcade-note, .stack-merge-message { display: none; }
  .stack-mobile-help { display: block; text-align: center; margin-top: 6px; font-size: 9px; }
  .stack-evolution { grid-template-columns: repeat(5, 1fr); gap: 16px 4px; }
  .stack-evolution small { font-size: 8px; }
  .stack-evolution li > span { width: 30px; height: 30px; font-size: 9px; }
}
</style>
