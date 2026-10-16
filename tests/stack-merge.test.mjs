import test from 'node:test'
import assert from 'node:assert/strict'
import Matter from 'matter-js'
import { createStackMerge, STACK_TIERS } from '../utils/stackMerge.js'

function advance(world, frames) { for (let i = 0; i < frames; i++) world.step(1000 / 60) }

test('two matching dropped tokens merge once, award points and respect the drop cooldown', () => {
  const merges = []
  const world = createStackMerge(Matter, { onMerge: event => merges.push(event) })
  assert.equal(world.drop(0, 200), true)
  assert.equal(world.drop(0, 200), false)
  advance(world, 90)
  assert.equal(world.drop(0, 200), true)
  advance(world, 150)
  assert.equal(merges.length, 1)
  assert.equal(merges[0].tier, 1)
  assert.equal(merges[0].points, 4)
  assert.equal(world.tokens().length, 1)
  assert.equal(world.tokens()[0].plugin.tier, 1)
  world.dispose()
})

test('different tiers remain separate and resetting starts a clean world', () => {
  const world = createStackMerge(Matter)
  world.drop(0, 200); advance(world, 90)
  world.drop(1, 200); advance(world, 150)
  assert.deepEqual(world.tokens().map(body => body.plugin.tier).sort(), [0, 1])
  world.reset()
  assert.equal(world.tokens().length, 0)
  assert.equal(world.status, 'playing')
  assert.equal(world.ready, true)
  world.dispose()
})

test('reaching the biggest token wins and prevents further drops', () => {
  const endings = []
  const world = createStackMerge(Matter, { onEnd: result => endings.push(result) })
  world.drop(STACK_TIERS.length - 2, 200); advance(world, 90)
  world.drop(STACK_TIERS.length - 2, 200); advance(world, 150)
  assert.equal(world.status, 'won')
  assert.deepEqual(endings, ['won'])
  assert.equal(world.tokens()[0].plugin.tier, STACK_TIERS.length - 1)
  assert.equal(world.drop(0, 100), false)
  world.dispose()
})

test('a settled token above the stack limit ends the game after the grace period', () => {
  const endings = []
  const world = createStackMerge(Matter, { onEnd: result => endings.push(result) })
  world.drop(0, 200)
  const body = world.tokens()[0]
  // A blocked token is held in place to isolate the overflow timer from pile geometry.
  Matter.Body.setPosition(body, { x: 200, y: 85 })
  Matter.Body.setStatic(body, true)
  advance(world, 180)
  assert.equal(world.status, 'playing')
  advance(world, 90)
  assert.equal(world.status, 'over')
  assert.deepEqual(endings, ['over'])
  world.reset()
  assert.equal(world.status, 'playing')
  world.dispose()
})
