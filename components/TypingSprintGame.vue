<script setup>
import { createTypingSprint } from '../utils/typingSprint.js'

const props = defineProps({ active: Boolean })
const emit = defineEmits(['view-change'])
const model = createTypingSprint(Math.random, reactive)
const game = model.state
const stats = computed(() => model.stats())
const board = ref(null)
const field = ref(null)
const reference = ref(null)
const mode = ref('code')
const modeOptions = [
  { id: 'code', name: 'Code Run', icon: 'fas fa-terminal', note: 'Git commands & code snippets' },
  { id: 'prompts', name: 'AI Prompts', icon: 'fas fa-wand-magic-sparkles', note: 'Long-form software prompts in English' }
]
const started = ref(false)
const mobilePlaying = ref(false)
const focused = ref(false)
const inView = ref(false)
const pageVisible = ref(true)
const keyboardOpen = ref(false)
const bestScores = reactive({ code: 0, prompts: 0 })
const best = computed(() => bestScores[mode.value])
const currentBest = computed(() => bestScores[game.mode])
const canResume = computed(() => started.value && game.phase !== 'finished' && mode.value === game.mode)
const feedback = ref('')
const composing = ref(false)
const running = computed(() => props.active && inView.value && pageVisible.value && focused.value && game.phase === 'running')
const levelNames = computed(() => game.mode === 'prompts' ? ['Clear requests', 'Feature specs', 'System thinking'] : ['Git essentials', 'Feature branches', 'Code flow'])
const rank = computed(() => stats.value.accuracy < 80 ? 'Slow down. Find your rhythm.' : stats.value.wpm >= 80 && stats.value.accuracy >= 95 ? 'Flow state unlocked.' : stats.value.wpm >= 50 && stats.value.accuracy >= 90 ? 'Fast fingers. Clean code.' : stats.value.wpm >= 30 && stats.value.accuracy >= 90 ? 'A steady builder.' : 'A good place to start.')
let lastTick = 0
let frame
let observer
let viewport
let viewportHeight = 0
watch(running, () => { lastTick = performance.now() }, { flush: 'sync' })
watch(() => game.phase, phase => {
  if (phase !== 'finished') return
  field.value?.blur()
  if (stats.value.score > currentBest.value) {
    bestScores[game.mode] = stats.value.score
    try { localStorage.setItem(`portfolio.typing-sprint.${game.mode}.best`, String(stats.value.score)) } catch {}
  }
})

function openGame() {
  mobilePlaying.value = true
  emit('view-change', true)
  nextTick(() => {
    if (matchMedia('(max-width: 800px)').matches) board.value?.scrollIntoView({ block: 'start', behavior: 'instant' })
    field.value?.focus({ preventScroll: true })
    if (reference.value && !game.draft) reference.value.scrollTop = 0
  })
}
function start() { model.reset(mode.value); started.value = true; feedback.value = ''; openGame() }
function followCaret() {
  nextTick(() => {
    const box = reference.value
    const caret = box?.querySelector('.is-caret') || box?.lastElementChild
    if (!box || !caret) return
    const bounds = box.getBoundingClientRect()
    const cursor = caret.getBoundingClientRect()
    if (cursor.bottom > bounds.bottom - 6) box.scrollTop += cursor.bottom - bounds.bottom + 6
    else if (cursor.top < bounds.top + 6) box.scrollTop -= bounds.top - cursor.top + 6
  })
}
function menu() {
  field.value?.blur()
  mobilePlaying.value = false
  emit('view-change', false)
  nextTick(() => board.value?.closest('.arcade-game')?.scrollIntoView({ block: 'start', behavior: 'instant' }))
}
function input(event) {
  if (composing.value || event.isComposing || !props.active || game.phase === 'finished') return
  feedback.value = ''
  model.input(event.target.value)
  event.target.value = game.draft
  followCaret()
}
function confirm() {
  if (!props.active || game.phase === 'finished') return
  feedback.value = model.submit() ? `${game.completed} ${game.mode === 'prompts' ? 'prompts' : 'lines'} completed. Keep going!` : 'Match the entire text, including spaces and punctuation, then press Enter.'
  if (field.value) field.value.value = game.draft
  if (reference.value && !game.draft) reference.value.scrollTop = 0
  field.value?.focus({ preventScroll: true })
}
function rejectPaste(event) { event.preventDefault(); feedback.value = 'Use your keyboard for this sprint.' }
function characterClass(index) {
  if (index >= game.draft.length) return index === game.draft.length ? 'is-caret' : ''
  return game.draft[index] === game.words[0][index] ? 'is-correct' : 'is-wrong'
}
function visibilityChanged() { pageVisible.value = !document.hidden }
function viewportChanged() {
  const height = viewport?.height || innerHeight
  if (!focused.value) viewportHeight = height
  keyboardOpen.value = focused.value && viewportHeight - height > 120
  if (keyboardOpen.value && props.active) nextTick(() => {
    const bounds = field.value?.getBoundingClientRect()
    const visibleBottom = (viewport?.offsetTop || 0) + height
    if (bounds && bounds.bottom > visibleBottom - 24) window.scrollBy({ top: bounds.bottom - visibleBottom + 24, behavior: 'instant' })
  })
}
function focus() { focused.value = true; viewportChanged() }
function blur() { focused.value = false; keyboardOpen.value = false }
onMounted(() => {
  for (const option of modeOptions) {
    try { const stored = Number(localStorage.getItem(`portfolio.typing-sprint.${option.id}.best`)); if (Number.isFinite(stored) && stored > 0) bestScores[option.id] = stored } catch {}
  }
  visibilityChanged()
  document.addEventListener('visibilitychange', visibilityChanged)
  viewport = window.visualViewport
  viewportHeight = viewport?.height || innerHeight
  viewport?.addEventListener('resize', viewportChanged)
  observer = new IntersectionObserver(([entry]) => { inView.value = entry.isIntersecting })
  observer.observe(board.value)
  lastTick = performance.now()
  function tick(now) {
    const delta = Math.max(0, now - lastTick)
    lastTick = now
    if (running.value) model.tick(delta)
    frame = requestAnimationFrame(tick)
  }
  frame = requestAnimationFrame(tick)
})
onBeforeUnmount(() => { cancelAnimationFrame(frame); observer?.disconnect(); document.removeEventListener('visibilitychange', visibilityChanged); viewport?.removeEventListener('resize', viewportChanged) })
</script>

<template>
  <div :class="['arcade-game', 'typing-sprint-game', { 'show-gameplay': mobilePlaying, 'typing-keyboard-open': keyboardOpen }]" :data-phase="started ? game.phase : 'idle'" :data-mode="game.mode">
    <div class="typing-layout">
      <div class="typing-menu">
        <p class="arcade-eyebrow">05 / LESS HESITATION. MORE FLOW.</p>
        <h3>Your keyboard.<br><span class="text-[#d4ff00]">Your superpower.</span></h3>
        <p class="arcade-description">Type real commands or write a software brief to an AI. Match spaces, punctuation, and capitalization, then press Enter. How much can you ship in 30 seconds?</p>
        <div class="typing-modes" role="group" aria-label="Typing mode"><button v-for="option in modeOptions" :key="option.id" type="button" :aria-pressed="mode === option.id" :class="{ selected: mode === option.id }" @click="mode = option.id"><i :class="option.icon" aria-hidden="true"></i><span><strong>{{ option.name }}</strong><small>{{ option.note }}</small></span></button></div>
        <ol class="typing-rules"><li><span>01</span>The clock starts on your first character.</li><li><span>02</span>Space types a space. Enter submits the whole text.</li><li><span>03</span>{{ mode === 'prompts' ? 'Practice longer English instructions for building software with AI.' : 'Practice feature branches, commit messages, and code syntax.' }}</li></ol>
        <p class="arcade-note">Correct text earns speed and score, even on your last unfinished line. Backspace fixes the text; mistakes still count toward accuracy.</p>
        <dl class="arcade-stats"><div><dt>Personal best</dt><dd class="accent">{{ best }}</dd></div><div><dt>Sprint length</dt><dd>30<small>s</small></dd></div></dl>
        <button type="button" class="arcade-button" @click="canResume ? openGame() : start()">{{ canResume ? 'Resume Typing Sprint' : 'Play Typing Sprint' }}</button>
      </div>
      <div ref="board" class="typing-board">
        <div class="typing-topline"><button type="button" class="typing-menu-back" aria-label="Back to Typing Sprint menu" @click="menu">← MENU</button><strong>{{ game.mode === 'prompts' ? 'AI PROMPTS' : 'CODE RUN' }}</strong><span>{{ started && game.phase !== 'finished' ? levelNames[stats.level] : '30-SECOND CHALLENGE' }}</span></div>
        <template v-if="!started"><div class="typing-idle-art" aria-hidden="true"><span>code</span><span>build</span><span>ship<span class="typing-idle-caret">_</span></span></div><h4 class="typing-idle-heading">Make every keystroke count.</h4><p class="arcade-note text-center">Speed is good. Speed with accuracy is better.</p></template>
        <template v-else-if="game.phase !== 'finished'">
          <dl class="typing-hud"><div><dt>Time</dt><dd data-testid="typing-time">{{ stats.remaining }}<small>s</small></dd></div><div><dt>WPM</dt><dd data-testid="typing-wpm">{{ stats.wpm }}</dd></div><div><dt>Accuracy</dt><dd data-testid="typing-accuracy">{{ stats.accuracy.toFixed(0) }}<small>%</small></dd></div><div><dt>Score</dt><dd data-testid="typing-score">{{ stats.score }}</dd></div></dl>
          <div class="typing-time-track" role="progressbar" aria-label="Sprint time remaining" :aria-valuenow="stats.remaining" :aria-valuemin="0" :aria-valuemax="30"><span :style="{ width: `${stats.remaining / 30 * 100}%` }"></span></div>
          <div class="typing-word-zone" @click="field?.focus()"><p class="arcade-eyebrow">{{ game.phase === 'ready' ? 'TYPE TO START' : !focused ? 'PAUSED · TAP THE INPUT TO RESUME' : game.mode === 'prompts' ? 'TYPE THIS PROMPT' : 'TYPE THIS LINE' }}</p><h4 ref="reference" :class="['typing-target-word', { 'typing-prompt-text': game.mode === 'prompts' }]" :aria-label="game.words[0]"><span v-for="(character, index) in game.words[0]" :key="index" :class="[characterClass(index), { 'is-space': character === ' ' }]" aria-hidden="true">{{ character === ' ' && game.mode === 'code' ? '·' : character }}</span><span v-if="game.draft.length > game.words[0].length" class="is-wrong typing-extra" aria-hidden="true">{{ game.draft.slice(game.words[0].length) }}</span></h4><p class="typing-upcoming"><span>{{ game.draft.length }} / {{ game.words[0].length }} CHARS</span><span>ENTER TO SUBMIT</span></p></div>
          <div class="typing-input-row"><input ref="field" :value="game.draft" class="typing-input" type="text" inputmode="text" enterkeyhint="send" autocomplete="off" autocorrect="off" autocapitalize="off" :spellcheck="false" maxlength="500" aria-label="Type the highlighted text" placeholder="Type the complete text…" @input="input" @focus="focus" @blur="blur" @keydown.enter.prevent="confirm" @paste="rejectPaste" @drop="rejectPaste" @beforeinput="$event.inputType === 'insertFromPaste' && rejectPaste($event)" @compositionstart="composing = true" @compositionend="composing = false; input($event)"><button type="button" class="typing-confirm" aria-label="Confirm text" :disabled="game.draft !== game.words[0]" @pointerdown.prevent @click="confirm">↵</button></div>
          <div class="typing-bottomline"><span>{{ game.completed }} {{ game.mode === 'prompts' ? 'prompts' : 'lines' }} · {{ game.streak }} streak</span><button type="button" aria-label="Restart Typing Sprint" @click="start">↻ RESTART</button></div>
          <p class="typing-feedback" aria-live="polite">{{ feedback || (game.phase === 'ready' ? 'Your first character starts the clock.' : 'Enter to submit · Backspace to fix') }}</p>
        </template>
        <template v-else>
          <div class="typing-result" role="status"><p class="arcade-eyebrow">SPRINT COMPLETE</p><p class="typing-final-wpm" data-testid="typing-final-wpm">{{ stats.wpm }}<span>WPM</span></p><h4>{{ rank }}</h4></div>
          <dl class="typing-result-grid"><div><dt>Accuracy</dt><dd>{{ stats.accuracy.toFixed(1) }}%</dd></div><div><dt>Score</dt><dd data-testid="typing-final-score">{{ stats.score }}</dd></div><div><dt>{{ game.mode === 'prompts' ? 'Prompts completed' : 'Lines shipped' }}</dt><dd>{{ game.completed }}</dd></div><div><dt>Best streak</dt><dd>{{ game.bestStreak }}</dd></div></dl>
          <div v-if="game.troubleWords.length" class="typing-practice"><p class="arcade-eyebrow">TRY THESE AGAIN NEXT TIME</p><div><span v-for="word in game.troubleWords.slice(0, 6)" :key="word">{{ word }}</span></div></div>
          <p class="arcade-note mt-5">{{ game.errors }} mistyped characters · Mode best {{ currentBest }}<br>Score rewards correct text and accuracy together.</p>
          <button type="button" class="arcade-button typing-play-again" @click="start">Run another sprint</button>
        </template>
      </div>
    </div>
  </div>
</template>

<style>
@media (max-width: 800px) {
  #playground:has(.typing-keyboard-open) .arcade-tabs { top: 0; }
  #playground:has(.typing-keyboard-open) h2 { display: none; }
  body:has(.typing-keyboard-open) #navbar { visibility: hidden; }
}
</style>
<style scoped>
.typing-layout { display: grid; grid-template-columns: minmax(0, .85fr) minmax(0, 1.15fr); gap: 48px; max-width: 1050px; margin: auto; align-items: start; }
.typing-menu { padding-top: 8px; }
.typing-modes { display: grid; gap: 8px; margin-top: 24px; }
.typing-modes button { display: flex; align-items: center; gap: 12px; padding: 14px; text-align: left; border: 1px solid #ffffff14; border-radius: 7px; color: #839b6d; }
.typing-modes button.selected { background: #d4ff0007; border-color: #d4ff0055; color: #d4ff00; }
.typing-modes strong { display: block; color: #c4d6b4; font-size: 12px; font-weight: 500; }
.typing-modes small { display: block; color: #798d68; font-size: 10px; margin-top: 4px; }
.typing-rules { display: grid; gap: 18px; margin: 28px 0; color: #a6b797; font-size: 12px; line-height: 1.8; }
.typing-rules li { display: flex; gap: 14px; }
.typing-rules span { color: #d4ff0066; font: 10px monospace; padding-top: 4px; }
.arcade-stats dd small { font-size: 12px; margin-left: 3px; }
.typing-board { padding: 24px; border: 1px solid #d4ff0025; border-radius: 12px; background: #090d09; min-width: 0; scroll-margin-top: 170px; }
.typing-topline { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding-bottom: 20px; border-bottom: 1px solid #ffffff0c; font: 8px monospace; letter-spacing: 1px; color: #839770; text-transform: uppercase; }
.typing-topline strong { color: #c3d2b6; font-weight: 400; }
.typing-menu-back { display: none; padding: 8px 0; color: #a2b889; }
.typing-hud { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; padding: 23px 0 18px; }
.typing-hud dt, .typing-result-grid dt { color: #7c906a; font: 8px monospace; letter-spacing: 1px; text-transform: uppercase; }
.typing-hud dd { color: #d4ff00; font: 700 27px 'Space Grotesk', sans-serif; margin-top: 5px; }
.typing-hud dd small { font-size: 11px; color: #7e9665; margin-left: 2px; }
.typing-time-track { height: 2px; background: #ffffff0b; }
.typing-time-track span { display: block; height: 100%; background: #d4ff0077; }
.typing-word-zone { padding: 35px 0 28px; text-align: center; cursor: text; overflow-wrap: anywhere; }
.typing-target-word { margin: 20px 0 22px; font: 600 clamp(18px, 2vw, 24px) monospace; letter-spacing: 0; color: #6d7b61; line-height: 1.8; text-align: left; white-space: pre-wrap; overflow-wrap: anywhere; max-height: 210px; overflow-y: auto; scrollbar-width: thin; scrollbar-color: #d4ff0033 transparent; }
.typing-target-word.typing-prompt-text { font-size: 17px; font-weight: 400; }
.typing-target-word .is-space { opacity: .5; }
.typing-target-word .is-correct { color: #d4ff00; }
.typing-target-word .is-wrong { color: #ed9f91; background: #ed9f9115; border-bottom: 2px solid #ed9f9166; }
.typing-target-word .is-caret { border-left: 2px solid #d4ff00; margin-left: -2px; }
.typing-extra { font-size: .7em; }
.typing-upcoming { display: flex; justify-content: center; flex-wrap: wrap; gap: 14px; color: #728563; font: 11px monospace; }
.typing-upcoming > span:first-child { color: #536547; font-size: 8px; padding-top: 2px; }
.typing-input-row { display: flex; align-items: stretch; border: 1px solid #d4ff0044; border-radius: 7px; overflow: hidden; }
.typing-input-row:focus-within { border-color: #d4ff0088; box-shadow: 0 0 0 3px #d4ff0005; }
.typing-input { flex: 1; min-width: 0; width: 100%; padding: 14px 16px; background: #d4ff0004; color: #e0ead6; font: 20px monospace; outline: none; border: 0; caret-color: #d4ff00; }
.typing-input::placeholder { font-size: 14px; color: #657a54; }
.typing-confirm { width: 48px; background: #d4ff0010; color: #d4ff00; font: 24px monospace; }
.typing-confirm:disabled { color: #4b5e3c; }
.typing-bottomline { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-top: 15px; color: #81986b; font: 9px monospace; }
.typing-bottomline button { padding: 7px 0; color: #97ac81; font-size: 8px; letter-spacing: 1px; }
.typing-feedback { min-height: 36px; margin-top: 12px; color: #8a9d77; font-size: 10px; line-height: 1.8; }
.typing-idle-art { display: grid; justify-content: center; gap: 9px; padding: 45px 0 30px; color: #5d7350; font: bold 35px monospace; }
.typing-idle-art > span:nth-child(2) { padding-left: 34px; color: #a1b786; }
.typing-idle-art > span:last-child { padding-left: 68px; color: #d4ff00; }
.typing-idle-caret { color: #d4ff00; }
.typing-idle-heading { color: #d5e4c8; font-size: 20px; font-weight: 600; text-align: center; margin-bottom: 15px; }
.typing-board > .arcade-note:last-child { padding-bottom: 20px; }
.typing-result { padding: 28px 0; text-align: center; }
.typing-final-wpm { color: #d4ff00; font: 700 70px 'Space Grotesk', sans-serif; letter-spacing: -3px; line-height: 1.2; margin: 18px 0 8px; }
.typing-final-wpm span { color: #8da674; font: 10px monospace; letter-spacing: 2px; margin-left: 8px; }
.typing-result h4 { color: #d4dfca; font-size: 18px; font-weight: 600; }
.typing-result-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
.typing-result-grid > div { border: 1px solid #ffffff0a; padding: 16px; }
.typing-result-grid dd { margin-top: 7px; color: #c9dcba; font: 700 24px 'Space Grotesk', sans-serif; }
.typing-practice { margin-top: 24px; }
.typing-practice > div { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; }
.typing-practice span { color: #b6a08f; background: #e3a18208; padding: 5px 7px; font: 10px monospace; overflow-wrap: anywhere; max-width: 100%; }
.typing-play-again { width: 100%; margin-top: 20px; }
@media (max-width: 800px) {
  .typing-layout { grid-template-columns: 1fr; gap: 0; }
  .typing-board { display: none; padding: 16px 12px; }
  .show-gameplay .typing-board { display: block; }
  .show-gameplay .typing-menu { display: none; }
  .typing-menu-back { display: block; }
  .typing-topline { font-size: 7px; padding-bottom: 12px; }
  .typing-hud { padding: 18px 0 15px; }
  .typing-hud dd { font-size: 24px; }
  .typing-word-zone { padding: 25px 0 22px; }
  .typing-target-word { font-size: 17px; margin: 15px 0 18px; }
  .typing-target-word.typing-prompt-text { font-size: 16px; max-height: 180px; }
  .typing-upcoming { font-size: 9px; gap: 10px; }
  .typing-input { padding: 12px; }
  .typing-keyboard-open .typing-board { padding: 10px; scroll-margin-top: 90px; }
  .typing-keyboard-open .typing-topline { padding-bottom: 5px; }
  .typing-keyboard-open .typing-hud { padding: 10px 0; }
  .typing-keyboard-open .typing-word-zone { padding: 12px 0; }
  .typing-keyboard-open .typing-target-word, .typing-keyboard-open .typing-target-word.typing-prompt-text { font-size: 16px; margin: 8px 0; max-height: 96px; }
  .typing-keyboard-open .typing-upcoming { display: none; }
  .typing-keyboard-open .typing-feedback { display: none; }
  .typing-keyboard-open .typing-bottomline { margin-top: 8px; }
}
</style>
