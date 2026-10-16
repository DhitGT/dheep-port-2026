export const STACK_TIERS = [
  { name: 'Bit', symbol: '01', radius: 15, color: '#b4c688' },
  { name: 'Byte', symbol: '0x', radius: 21, color: '#88cfa8' },
  { name: 'Function', symbol: 'ƒ()', radius: 28, color: '#76c9d0' },
  { name: 'Module', symbol: '</>', radius: 35, color: '#8baceb' },
  { name: 'Package', symbol: 'pkg', radius: 43, color: '#b49ce5' },
  { name: 'Service', symbol: 'API', radius: 52, color: '#d6a4ca' },
  { name: 'App', symbol: 'APP', radius: 62, color: '#e0bd85' },
  { name: 'Platform', symbol: 'SYS', radius: 73, color: '#dddc90' },
  { name: 'Production', symbol: 'SHIP', radius: 86, color: '#d4ff00' }
]

export const STACK_WIDTH = 400
export const STACK_HEIGHT = 520
export const STACK_LIMIT = 94

export function createStackMerge(Matter, { onMerge = () => {}, onEnd = () => {} } = {}) {
  const { Engine, Bodies, Body, Composite, Events } = Matter
  const engine = Engine.create({ enableSleeping: true })
  engine.gravity.y = 1.1
  let elapsed = 0
  let lastDrop = -Infinity
  let status = 'playing'
  let queue = []
  const tokens = () => Composite.allBodies(engine.world).filter(body => Number.isInteger(body.plugin?.tier))
  function token(tier, x, y) {
    const body = Bodies.circle(x, y, STACK_TIERS[tier].radius, {
      restitution: .13, friction: .3, frictionStatic: .7, frictionAir: .008,
      label: STACK_TIERS[tier].name,
      plugin: { tier, born: elapsed, danger: 0, consumed: false }
    })
    Composite.add(engine.world, body)
    return body
  }
  function collision({ pairs }) {
    for (const { bodyA: a, bodyB: b } of pairs) {
      const tier = a.plugin?.tier
      if (!Number.isInteger(tier) || tier !== b.plugin?.tier || tier >= STACK_TIERS.length - 1 || a.plugin.consumed || b.plugin.consumed) continue
      // Reserve both bodies immediately so simultaneous contacts cannot merge twice.
      a.plugin.consumed = b.plugin.consumed = true
      queue.push({ a, b, tier: tier + 1, x: (a.position.x + b.position.x) / 2, y: (a.position.y + b.position.y) / 2 })
    }
  }
  Events.on(engine, 'collisionStart collisionActive', collision)
  function reset() {
    Composite.clear(engine.world, false)
    Engine.clear(engine)
    queue = []
    elapsed = 0
    lastDrop = -Infinity
    status = 'playing'
    const wall = { isStatic: true, friction: .6 }
    Composite.add(engine.world, [
      Bodies.rectangle(STACK_WIDTH / 2, STACK_HEIGHT + 15, STACK_WIDTH, 40, wall),
      Bodies.rectangle(-15, STACK_HEIGHT / 2, 40, STACK_HEIGHT * 3, wall),
      Bodies.rectangle(STACK_WIDTH + 15, STACK_HEIGHT / 2, 40, STACK_HEIGHT * 3, wall)
    ])
  }
  function drop(tier, x) {
    if (status !== 'playing' || elapsed - lastDrop < 450 || !Number.isInteger(tier) || !STACK_TIERS[tier]) return false
    const radius = STACK_TIERS[tier].radius
    token(tier, Math.max(radius + 8, Math.min(STACK_WIDTH - radius - 8, x)), 40)
    lastDrop = elapsed
    return true
  }
  function step(delta) {
    if (status !== 'playing') return
    const dt = Math.min(Math.max(delta, 0), 1000 / 60)
    elapsed += dt
    Engine.update(engine, dt)
    const pending = queue
    queue = []
    for (const merge of pending) {
      Composite.remove(engine.world, [merge.a, merge.b])
      const radius = STACK_TIERS[merge.tier].radius
      const body = token(merge.tier, Math.max(radius + 6, Math.min(STACK_WIDTH - radius - 6, merge.x)), Math.min(STACK_HEIGHT - radius - 6, merge.y))
      Body.setVelocity(body, { x: 0, y: -.8 })
      onMerge({ tier: merge.tier, points: 2 ** (merge.tier + 1), x: body.position.x, y: body.position.y })
      if (merge.tier === STACK_TIERS.length - 1) {
        status = 'won'
        onEnd('won')
      }
    }
    for (const body of tokens()) {
      const aboveLimit = body.position.y - body.circleRadius < STACK_LIMIT
      body.plugin.danger = aboveLimit && elapsed - body.plugin.born > 1800 && body.speed < 1.5 ? body.plugin.danger + dt : 0
      if (body.plugin.danger > 2200 && status === 'playing') {
        status = 'over'
        onEnd('over')
      }
    }
  }
  reset()
  return {
    engine, tokens, reset, drop, step,
    get status() { return status },
    get ready() { return status === 'playing' && elapsed - lastDrop >= 450 },
    dispose() { Events.off(engine); Composite.clear(engine.world, false); Engine.clear(engine) }
  }
}
