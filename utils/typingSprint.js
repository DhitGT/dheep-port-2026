const WORDS = [
  ['code', 'data', 'loop', 'type', 'node', 'task', 'test', 'push', 'byte', 'view', 'grid', 'hook', 'build', 'state', 'await', 'route'],
  ['async', 'commit', 'object', 'deploy', 'import', 'render', 'module', 'branch', 'socket', 'worker', 'method', 'export', 'schema', 'client'],
  ['interface', 'component', 'typescript', 'middleware', 'transaction', 'dependency', 'observable', 'architecture', 'deployment', 'validation', 'repository', 'composition']
]

export function insertedRange(previous, next) {
  let start = 0
  while (start < previous.length && start < next.length && previous[start] === next[start]) start++
  let oldEnd = previous.length, newEnd = next.length
  while (oldEnd > start && newEnd > start && previous[oldEnd - 1] === next[newEnd - 1]) { oldEnd--; newEnd-- }
  return { start, text: next.slice(start, newEnd) }
}

export function createTypingSprint(random = Math.random, makeReactive = value => value) {
  const state = makeReactive({
    phase: 'ready', elapsed: 0, draft: '', words: [], completed: 0, confirmedChars: 0,
    attempts: 0, errors: 0, streak: 0, bestStreak: 0, troubleWords: []
  })
  const level = () => Math.min(2, Math.floor(state.completed / 8))
  function word(previous) {
    const pool = WORDS[level()]
    let index = Math.min(pool.length - 1, Math.floor(random() * pool.length))
    if (pool[index] === previous) index = (index + 1) % pool.length
    return pool[index]
  }
  function reset() {
    Object.assign(state, { phase: 'ready', elapsed: 0, draft: '', words: [], completed: 0, confirmedChars: 0, attempts: 0, errors: 0, streak: 0, bestStreak: 0, troubleWords: [] })
    for (let i = 0; i < 4; i++) state.words.push(word(state.words.at(-1)))
  }
  function input(value) {
    if (state.phase === 'finished') return
    const submitAfter = /\s$/.test(value)
    const next = value.replace(/\s+$/, '')
    const inserted = insertedRange(state.draft, next)
    if (inserted.text.length && state.phase === 'ready') state.phase = 'running'
    for (let i = 0; i < inserted.text.length; i++) {
      state.attempts++
      if (inserted.text[i] !== state.words[0][inserted.start + i]) {
        state.errors++; state.streak = 0
        if (!state.troubleWords.includes(state.words[0])) state.troubleWords.push(state.words[0])
      }
    }
    state.draft = next
    return submitAfter ? submit() : false
  }
  function submit() {
    if (state.phase !== 'running' || state.draft !== state.words[0]) return false
    state.confirmedChars += state.words[0].length + 1
    state.completed++; state.streak++
    state.bestStreak = Math.max(state.bestStreak, state.streak)
    state.words.shift()
    state.words.push(word(state.words.at(-1)))
    state.draft = ''
    return true
  }
  function tick(delta) {
    if (state.phase !== 'running') return
    state.elapsed = Math.min(30000, state.elapsed + Math.max(0, delta))
    if (state.elapsed >= 30000) state.phase = 'finished'
  }
  function stats() {
    const accuracy = state.attempts ? (state.attempts - state.errors) / state.attempts * 100 : 100
    return {
      accuracy: Math.round(accuracy * 10) / 10,
      wpm: state.elapsed ? Math.round((state.confirmedChars / 5) / (Math.max(1000, state.elapsed) / 60000)) : 0,
      score: Math.round(state.confirmedChars * (accuracy / 100) ** 2),
      level: level(), remaining: Math.max(0, Math.ceil((30000 - state.elapsed) / 1000))
    }
  }
  reset()
  return { state, reset, input, submit, tick, stats }
}
