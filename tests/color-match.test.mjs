import test from 'node:test'
import assert from 'node:assert/strict'
import { rgbaAccuracy, randomColor, formatRGBA, averageAccuracy } from '../utils/colorMatch.js'

test('identical RGBA scores 100 and maximum channel distance scores 0', () => {
  const target = { r: 52, g: 150, b: 224, a: .58 }
  assert.equal(rgbaAccuracy(target, { ...target }), 100)
  assert.equal(rgbaAccuracy({ r: 0, g: 0, b: 0, a: 0 }, { r: 255, g: 255, b: 255, a: 1 }), 0)
  assert.equal(rgbaAccuracy({ r: 0, g: 0, b: 0, a: 0 }, { r: 0, g: 0, b: 0, a: 1 }), 50)
})
test('closer colors score higher and comparisons are symmetric', () => {
  const target = { r: 100, g: 100, b: 100, a: .5 }
  const near = { r: 110, g: 110, b: 110, a: .55 }
  const far = { r: 240, g: 10, b: 200, a: 1 }
  assert.ok(rgbaAccuracy(target, near) > rgbaAccuracy(target, far))
  assert.equal(rgbaAccuracy(target, near), rgbaAccuracy(near, target))
})
test('random colors span the RGB range with visible alpha and consistent CSS formatting', () => {
  assert.deepEqual(randomColor(() => 0), { r: 0, g: 0, b: 0, a: .35 })
  assert.deepEqual(randomColor(() => 1 - Number.EPSILON), { r: 255, g: 255, b: 255, a: 1 })
  assert.equal(formatRGBA({ r: 10, g: 20, b: 30, a: .5 }), 'rgba(10, 20, 30, 0.50)')
})
test('session average includes all five colors and handles an empty session', () => {
  assert.equal(averageAccuracy([]), 0)
  assert.equal(averageAccuracy([100, 80, 60, 40, 20].map(accuracy => ({ accuracy }))), 60)
})
