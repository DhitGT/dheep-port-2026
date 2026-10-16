const SNIPPETS = [
  ['git status', 'git add .', 'git push origin main', 'npm run dev', 'npm run build', 'git log --oneline', 'npm run test', 'git switch main', 'git pull origin main', 'const ready = true;'],
  ['git checkout -b feat/auth-flow', 'git push origin feat/login-page', 'git commit -m "feat: add login"', 'git switch -c dev/fix-navbar', 'npm install --save-dev typescript', 'const total = items.length;', 'return user.name ?? "guest";', 'const active = users.filter(isActive);'],
  ['git commit -m "fix: handle empty API response"', 'const result = await fetch("/api/users");', 'const names = users.map(user => user.name);', 'if (response.ok) return response.json();', 'export const delay = ms => new Promise(r => setTimeout(r, ms));', 'SELECT name FROM users WHERE active = true;']
]
const PROMPTS = [
  [
    'Create a responsive login page with email and password fields, clear validation messages, and a loading state.',
    'Build a task list where users can add, complete, edit, and delete tasks without refreshing the page.',
    'Add a dark mode toggle and remember the selected theme when the user returns to the website.',
    'Create a search input that filters the project cards by title and technology.',
    'Design a mobile navigation menu with accessible buttons and smooth opening and closing transitions.',
    'Show a helpful empty state when a user has no projects, with a button to create the first one.'
  ],
  [
    'Implement a paginated API endpoint for project search, validate query parameters, and return consistent error responses.',
    'Add form validation that explains each error beside its field, preserves user input, and prevents duplicate submissions.',
    'Build an accessible image gallery with keyboard navigation, lazy loading, and a responsive grid that works on small screens.',
    'Create a dashboard that shows recent activity, project progress, and clear loading states while data is being fetched.'
  ],
  [
    'Design an offline-first notes application that stores changes locally, synchronizes them when the connection returns, and clearly handles conflicting edits.',
    'Refactor the authentication flow into reusable services, add tests for expired sessions, and make sure protected routes redirect users safely.',
    'Implement a realtime notification system with connection recovery, unread counts, and a fallback that keeps the interface usable when the server is unavailable.',
    'Review the existing API integration, identify unnecessary network requests, and improve caching without showing stale data after a user makes an update.'
  ]
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
    mode: 'code', phase: 'ready', elapsed: 0, draft: '', words: [], completed: 0, confirmedChars: 0,
    attempts: 0, errors: 0, streak: 0, bestStreak: 0, troubleWords: []
  })
  const level = () => state.completed >= 5 ? 2 : state.completed >= 2 ? 1 : 0
  function word(previous) {
    const pool = (state.mode === 'prompts' ? PROMPTS : SNIPPETS)[level()]
    let index = Math.min(pool.length - 1, Math.floor(random() * pool.length))
    if (pool[index] === previous) index = (index + 1) % pool.length
    return pool[index]
  }
  function reset(mode = state.mode) {
    Object.assign(state, { mode: mode === 'prompts' ? 'prompts' : 'code', phase: 'ready', elapsed: 0, draft: '', words: [], completed: 0, confirmedChars: 0, attempts: 0, errors: 0, streak: 0, bestStreak: 0, troubleWords: [] })
    for (let i = 0; i < 4; i++) state.words.push(word(state.words.at(-1)))
  }
  function input(value) {
    if (state.phase === 'finished') return
    // Spaces and punctuation belong to the snippet; only Enter/the button submits.
    const next = value
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
    return false
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
    let prefix = 0
    while (prefix < state.draft.length && state.draft[prefix] === state.words[0][prefix]) prefix++
    const creditedChars = state.confirmedChars + prefix
    return {
      accuracy: Math.round(accuracy * 10) / 10,
      wpm: state.elapsed ? Math.round((creditedChars / 5) / (Math.max(1000, state.elapsed) / 60000)) : 0,
      score: Math.round(creditedChars * (accuracy / 100) ** 2),
      level: level(), remaining: Math.max(0, Math.ceil((30000 - state.elapsed) / 1000))
    }
  }
  reset()
  return { state, reset, input, submit, tick, stats }
}
