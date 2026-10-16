<script setup>
const props = defineProps({ active: Boolean })
const emit = defineEmits(['view-change'])
const mobilePlaying = ref(false)
const board = ref(null)
const cells = ref(Array.from({ length: 12 }, () => null))
const state = ref('idle')
const paused = ref(false)
const score = ref(0)
const best = ref(0)
const patched = ref(0)
const mistakes = ref(0)
const streak = ref(0)
const elapsed = ref(0)
const inView = ref(true)
const pageVisible = ref(true)
const message = ref('Patch the bugs. Leave healthy code alone.')
const remaining = computed(() => Math.max(0, Math.ceil((30000 - elapsed.value) / 1000)))
const multiplier = computed(() => Math.min(4, 1 + Math.floor(streak.value / 5)))
const autoPaused = computed(() => state.value === 'playing' && (!props.active || !inView.value || !pageVisible.value))
let frame
let observer
let waveElapsed = 0
let sequence = 0
let lastTick = 0

watch([() => props.active, inView, pageVisible, paused, state], () => { lastTick = performance.now() }, { flush: 'sync' })

function saveBest() {
  if (score.value <= best.value) return
  best.value = score.value
  try { localStorage.setItem('portfolio.bug-hunt.best', String(best.value)) } catch {}
}
function spawn() {
  if (cells.value.some(cell => cell?.kind === 'bug' && !cell.hit)) streak.value = 0
  const slots = Array.from({ length: 12 }, (_, index) => index)
  // Fisher-Yates keeps each cell equally likely without repeated targets.
  for (let i = slots.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [slots[i], slots[j]] = [slots[j], slots[i]] }
  const next = Array.from({ length: 12 }, () => null)
  slots.slice(0, elapsed.value > 15000 ? 4 : 3).forEach((slot, index) => {
    next[slot] = { id: sequence++, kind: index === 2 ? 'healthy' : 'bug', hit: false }
  })
  cells.value = next
}
function start() {
  score.value = 0; patched.value = 0; mistakes.value = 0; streak.value = 0; elapsed.value = 0
  cells.value = Array.from({ length: 12 }, () => null)
  waveElapsed = 0; paused.value = false; state.value = 'playing'
  message.value = 'You’re on call. Patch the red bugs!'
  spawn()
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
function hit(index) {
  const cell = cells.value[index]
  if (state.value !== 'playing' || paused.value || autoPaused.value || !cell || cell.hit) return
  cell.hit = true
  if (cell.kind === 'bug') {
    streak.value++
    const points = 10 * multiplier.value
    score.value += points; patched.value++
    message.value = `Bug patched. +${points}${multiplier.value > 1 ? ` / ${multiplier.value}× combo` : ''}`
    saveBest()
  } else {
    score.value = Math.max(0, score.value - 15); mistakes.value++; streak.value = 0
    message.value = 'That code was healthy! −15. Combo reset.'
  }
}
function visibilityChanged() { pageVisible.value = !document.hidden }
onMounted(() => {
  try { const stored = Number(localStorage.getItem('portfolio.bug-hunt.best')); if (Number.isFinite(stored) && stored > 0) best.value = stored } catch {}
  visibilityChanged()
  document.addEventListener('visibilitychange', visibilityChanged)
  observer = new IntersectionObserver(([entry]) => { inView.value = entry.isIntersecting })
  observer.observe(board.value)
  lastTick = performance.now()
  function tick(now) {
    const delta = Math.max(0, now - lastTick)
    lastTick = now
    if (state.value === 'playing' && !paused.value && !autoPaused.value) {
      elapsed.value = Math.min(30000, elapsed.value + delta)
      waveElapsed += delta
      if (elapsed.value >= 30000) {
        state.value = 'finished'; saveBest()
        message.value = `Session complete. ${patched.value} bugs patched, ${mistakes.value} healthy-code mistakes. Score: ${score.value}.`
      } else if (waveElapsed >= 1150 - elapsed.value / 60) {
        waveElapsed = 0; spawn()
      }
    }
    frame = requestAnimationFrame(tick)
  }
  frame = requestAnimationFrame(tick)
})
onBeforeUnmount(() => { cancelAnimationFrame(frame); observer?.disconnect(); document.removeEventListener('visibilitychange', visibilityChanged) })
</script>

<template>
  <div :class="['arcade-game', 'bug-hunt-game', { 'show-gameplay': mobilePlaying }]" :data-state="state">
    <div class="bug-hunt-layout">
      <div class="bug-hunt-sidebar">
        <p class="arcade-eyebrow">03 / THE 30-SECOND DEBUG SPRINT</p>
        <h3>Less bugs.<br><span class="text-[#d4ff00]">More shipping.</span></h3>
        <p class="arcade-description">Your build is crawling with bugs. Patch the red ones before they disappear, but leave the green code alone. Things get faster as the deadline approaches.</p>
        <div class="arcade-mobile-only mt-6"><p class="arcade-note mb-4">30-SECOND SPRINT · BEST SCORE {{ best }}</p><button type="button" class="arcade-button" @click="state === 'playing' ? showGame() : start()">{{ state === 'playing' ? 'Resume Bug Hunt' : 'Play Bug Hunt' }}</button></div>
        <dl class="arcade-stats"><div><dt>Score</dt><dd class="accent" data-testid="bug-score">{{ score }}</dd></div><div><dt>Best</dt><dd>{{ best }}</dd></div><div><dt>Time left</dt><dd data-testid="bug-time">{{ remaining }}<small>s</small></dd></div></dl>
        <div class="bug-combo"><span>{{ multiplier }}×</span><div><strong>{{ streak }} clean patches</strong><small>Every 5 in a row upgrades your combo. Max 4×.</small></div></div>
        <div class="bug-rules"><p><i class="fas fa-bug" aria-hidden="true"></i><span>BUG <small>+10 × combo</small></span></p><p><i class="fas fa-code" aria-hidden="true"></i><span>HEALTHY CODE <small>−15, combo reset</small></span></p></div>
        <div class="bug-desktop-controls flex flex-wrap gap-3 mt-6"><button type="button" class="arcade-button" @click="start">{{ state === 'idle' ? 'Start debugging' : state === 'finished' ? 'Try another sprint' : 'Restart sprint' }}</button><button v-if="state === 'playing'" type="button" class="arcade-button arcade-button-secondary" @click="paused = !paused">{{ paused ? 'Resume' : 'Pause' }}</button></div>
        <p class="arcade-note mt-4">Click / tap the bugs. Keyboard: Tab to a target, Enter to patch.<br>The timer pauses when you leave the game.</p>
        <p class="bug-message" role="status">{{ autoPaused ? 'Auto-paused. Your deadline can wait.' : message }}</p>
      </div>
      <div ref="board" class="bug-board-wrap">
        <div class="arcade-mobile-toolbar bug-mobile-toolbar">
          <div class="arcade-mobile-topline"><button type="button" aria-label="Back to Bug Hunt menu" @click="menu">← MENU</button><strong>BUG HUNT</strong></div>
          <dl class="arcade-mobile-stats"><div><dt>Score</dt><dd data-testid="bug-mobile-score">{{ score }}</dd></div><div><dt>Time left</dt><dd data-testid="bug-mobile-time">{{ remaining }}s</dd></div><div><dt>Combo</dt><dd>{{ multiplier }}×</dd></div></dl>
          <div class="arcade-mobile-actions"><button type="button" :aria-label="paused ? 'Resume Bug Hunt' : 'Pause Bug Hunt'" :disabled="state !== 'playing'" @click="paused = !paused">{{ paused ? 'RESUME' : 'PAUSE' }}</button><button type="button" aria-label="Restart Bug Hunt" @click="start">↻ RESTART</button></div>
        </div>
        <div class="bug-board-stage">
        <div class="bug-board-top"><span><span class="bug-status-dot" :class="{ running: state === 'playing' && !paused && !autoPaused }"></span>{{ state === 'playing' ? paused || autoPaused ? 'SESSION PAUSED' : 'DEBUG SESSION LIVE' : 'AWAITING DEVELOPER' }}</span><span>v0.{{ patched }}</span></div>
        <div class="bug-grid" aria-label="Bug Hunt targets">
          <button v-for="(cell, index) in cells" :key="index" type="button" :class="['bug-cell', { 'has-bug': cell?.kind === 'bug' && !cell.hit, 'has-healthy': cell?.kind === 'healthy' && !cell.hit, 'is-patched': cell?.hit && cell.kind === 'bug', 'is-mistake': cell?.hit && cell.kind === 'healthy' }]" :disabled="!cell || cell.hit || state !== 'playing' || paused || autoPaused" :aria-label="cell?.hit ? `Patched slot ${index + 1}` : cell?.kind === 'bug' ? `Patch bug at slot ${index + 1}` : cell?.kind === 'healthy' ? `Healthy code at slot ${index + 1}` : `Empty slot ${index + 1}`" @click="hit(index)">
            <span class="bug-cell-number">{{ String(index + 1).padStart(2, '0') }}</span><i v-if="cell" :class="cell.hit ? cell.kind === 'bug' ? 'fas fa-check' : 'fas fa-xmark' : cell.kind === 'bug' ? 'fas fa-bug' : 'fas fa-code'" aria-hidden="true"></i><span v-if="cell && !cell.hit" class="bug-cell-label">{{ cell.kind === 'bug' ? 'BUG' : 'OK' }}</span><span v-else-if="!cell" class="bug-cell-empty" aria-hidden="true">+</span>
          </button>
        </div>
        <div class="bug-timer-track" role="progressbar" aria-label="Time remaining" :aria-valuenow="remaining" :aria-valuemin="0" :aria-valuemax="30"><span :style="{ width: `${remaining / 30 * 100}%` }"></span></div>
        <div v-if="state !== 'playing' || paused" class="bug-overlay">
          <span class="bug-overlay-icon" aria-hidden="true"><i :class="state === 'finished' ? 'fas fa-check-double' : 'fas fa-bug'"></i></span>
          <p class="arcade-eyebrow">{{ paused ? 'BRB, COFFEE BREAK' : state === 'finished' ? 'DEBUG SESSION COMPLETE' : 'YOUR BUILD NEEDS YOU' }}</p>
          <h4>{{ paused ? 'Deadline paused.' : state === 'finished' ? `${patched} bugs patched.` : 'Find. Fix. Repeat.' }}</h4>
          <p class="arcade-note">{{ state === 'finished' ? `Score ${score} · ${mistakes} mistakes` : '30 seconds. Quick hands. Clean code.' }}</p>
          <button type="button" class="arcade-button mt-4" @click="paused ? paused = false : start()">{{ paused ? 'Resume debugging' : state === 'finished' ? 'Play again' : 'Start Bug Hunt' }}</button>
        </div>
        </div>
        <p class="bug-mobile-status arcade-note" role="status">{{ message }}</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.bug-hunt-layout { display: grid; grid-template-columns: minmax(0, 1fr) minmax(260px, 460px); gap: 50px; max-width: 1000px; margin: auto; align-items: center; }
.arcade-stats dd small { font-size: 12px; color: #738365; padding-left: 4px; }
.bug-combo { display: flex; align-items: center; gap: 12px; padding: 15px 0; border-top: 1px solid #ffffff10; border-bottom: 1px solid #ffffff10; }
.bug-combo > span { font: 700 28px 'Space Grotesk', sans-serif; color: #d4ff00; }
.bug-combo strong { display: block; color: #b0bda2; font-size: 12px; font-weight: 400; }
.bug-combo small { display: block; font-size: 10px; color: #748169; margin-top: 4px; }
.bug-rules { display: flex; flex-wrap: wrap; gap: 25px; margin-top: 20px; }
.bug-rules p { display: flex; align-items: center; gap: 10px; font: 9px monospace; color: #a9b89b; }
.bug-rules i { font-size: 18px; color: #e99e81; }
.bug-rules p:last-child i { color: #8fb483; }
.bug-rules small { display: block; color: #6d7a63; margin-top: 5px; font-size: 9px; }
.bug-message { min-height: 38px; margin-top: 20px; color: #b0be9e; font: 11px monospace; line-height: 1.8; }
.bug-board-wrap { position: relative; border: 1px solid #d4ff0022; border-radius: 12px; background: #090d09; overflow: hidden; scroll-margin-top: 80px; }
.bug-board-stage { position: relative; }
.bug-mobile-status { display: none; }
.bug-board-top { display: flex; justify-content: space-between; align-items: center; padding: 18px 16px; font: 8px monospace; letter-spacing: 1px; color: #839375; border-bottom: 1px solid #ffffff0c; }
.bug-status-dot { display: inline-block; width: 4px; height: 4px; border-radius: 50%; background: #505b46; margin: 0 7px 2px 0; }
.bug-status-dot.running { background: #d4ff00; }
.bug-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; padding: 16px; }
.bug-cell { aspect-ratio: 1.25; position: relative; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; border: 1px solid #ffffff0b; border-radius: 7px; background: #10150e; color: #47533e; cursor: pointer; }
.bug-cell:disabled { cursor: default; }
.bug-cell i { font-size: 26px; }
.bug-cell-number { position: absolute; left: 7px; top: 6px; font: 8px monospace; opacity: .5; }
.bug-cell-label { font: 8px monospace; letter-spacing: 2px; }
.bug-cell-empty { color: #2d3925; font: 20px monospace; }
.bug-cell.has-bug { color: #efa68b; background: #e99e810e; border-color: #e99e8133; }
.bug-cell.has-bug:hover { border-color: #e99e8199; }
.bug-cell.has-healthy { color: #8fb483; background: #8fb48308; border-color: #8fb48322; }
.bug-cell.is-patched { color: #d4ff00; background: #d4ff000b; }
.bug-cell.is-mistake { color: #e77767; background: #e7776715; }
.bug-timer-track { height: 3px; background: #ffffff08; }
.bug-timer-track span { display: block; height: 100%; background: #d4ff0088; }
.bug-overlay { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; text-align: center; padding: 18px; background: #090d09ec; backdrop-filter: blur(3px); }
.bug-overlay-icon { font-size: 40px; color: #d4ff00; margin-bottom: 12px; }
.bug-overlay h4 { font-size: clamp(23px, 4vw, 30px); font-weight: 700; letter-spacing: -1px; }
@media (max-width: 800px) {
  .bug-hunt-layout { grid-template-columns: 1fr; gap: 0; }
  .bug-board-wrap { display: none; width: min(100%, 460px); margin: auto; }
  .bug-board-wrap { scroll-margin-top: 170px; }
  .show-gameplay .bug-board-wrap { display: block; }
  .show-gameplay .bug-hunt-sidebar { display: none; }
  .bug-hunt-sidebar > .arcade-stats, .bug-desktop-controls, .bug-hunt-sidebar > .arcade-note, .bug-message { display: none; }
  .bug-mobile-toolbar { padding: 14px 12px 0; }
  .bug-mobile-status { display: block; min-height: 46px; padding: 12px; font-size: 9px; }
  .bug-combo { margin-top: 24px; }
  .bug-grid { gap: 7px; padding: 12px; }
  .bug-cell i { font-size: 22px; }
}
</style>
