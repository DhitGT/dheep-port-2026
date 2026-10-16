<script setup>
import profile from '../data/profile.json'
import details from '../data/skill-details.js'

const container = ref(null)
const width = ref(500)
const height = ref(360)
const angle = ref(.4)
const clock = ref(0)
const zoom = ref(0)
const selected = ref(null)
const hovered = ref(null)
const activePart = ref(null)
const reduced = ref(false)
let targetZoom = 0
let frame
let resizeObserver
let visibilityObserver
let visible = true
let media
const indices = new Map(profile.sphere.map((label, index) => [label, index]))
const coordinates = profile.sphere.map((label, index) => {
  const y = 1 - index / (profile.sphere.length - 1) * 2
  const theta = index * Math.PI * (3 - Math.sqrt(5))
  return { label, x: Math.cos(theta) * Math.sqrt(1 - y * y), y, z: Math.sin(theta) * Math.sqrt(1 - y * y) }
})
// Outer connections form a visual mesh; each node's inner branches remain factual.
const mesh = []
const meshKeys = new Set()
coordinates.forEach((point, index) => {
  coordinates.map((other, otherIndex) => ({
    index: otherIndex,
    distance: (point.x - other.x) ** 2 + (point.y - other.y) ** 2 + (point.z - other.z) ** 2
  })).filter(other => other.index !== index).sort((a, b) => a.distance - b.distance).slice(0, 3).forEach(other => {
    const key = [index, other.index].sort((a, b) => a - b).join(':')
    if (meshKeys.has(key)) return
    meshKeys.add(key)
    mesh.push({ from: point.label, to: coordinates[other.index].label, kind: 'visual' })
  })
})
const trafficStride = Math.ceil(mesh.length / 19)
mesh.forEach((edge, index) => {
  if (index % trafficStride === 0) edge.traffic = (index / trafficStride) % 7 === 0 ? 'busy' : 'normal'
})
const basePoints = computed(() => {
  const radius = Math.max(0, Math.min(width.value / 2 - 50, height.value / 2 - 10))
  return coordinates.map(point => ({
    label: point.label,
    x: (point.x * Math.cos(angle.value) - point.z * Math.sin(angle.value)) * radius,
    y: point.y * radius,
    z: point.x * Math.sin(angle.value) + point.z * Math.cos(angle.value)
  }))
})
const points = computed(() => {
  const origin = basePoints.value[indices.get(selected.value)] || { x: 0, y: 0 }
  // One camera transform for the whole graph preserves the surrounding network.
  const cameraScale = 1 + zoom.value * .45
  return basePoints.value.map(point => ({
    ...point,
    x: width.value / 2 + (point.x - origin.x * zoom.value * .7) * cameraScale,
    y: height.value / 2 + (point.y - origin.y * zoom.value * .7) * cameraScale,
    opacity: point.label === selected.value ? 1 : (point.z + 1.5) / 2.5 * (1 - zoom.value * .2),
    scale: ((point.z + 2) / 2.4) * (1 + zoom.value * .22) + (point.label === selected.value ? zoom.value * .25 : 0)
  }))
})
const edges = computed(() => mesh.map(edge => ({
  ...edge, start: points.value[indices.get(edge.from)], end: points.value[indices.get(edge.to)]
})))
const packets = computed(() => edges.value.filter(edge => edge.traffic).flatMap((edge, index) => {
  const busy = edge.traffic === 'busy'
  const count = busy ? 4 : 2
  const duration = busy ? 1400 + index * 21 : 3400 + (index % 5) * 420
  return Array.from({ length: count }, (_, i) => {
    const phase = (clock.value / duration + Math.floor(i / 2) / (count / 2) + index * .137) % 1
    const response = i % 2 === 1
    const progress = response ? 1 - phase : phase
    const depth = (edge.start.z + (edge.end.z - edge.start.z) * progress + 1) / 2
    return {
      key: `${edge.from}-${edge.to}-${i}`, from: edge.from, to: edge.to, response,
      x: edge.start.x + (edge.end.x - edge.start.x) * progress,
      y: edge.start.y + (edge.end.y - edge.start.y) * progress,
      radius: busy ? 1.3 : 1,
      opacity: (.12 + depth * .2) * Math.min(1, phase * 10, (1 - phase) * 10) * (1 - zoom.value * .2)
    }
  })
}))
const focusPoint = computed(() => points.value[indices.get(selected.value)])
const childPoints = computed(() => {
  if (!selected.value) return []
  const spread = Math.max(0, (zoom.value - .2) / .8)
  return details[selected.value].parts.map(([label, description], index) => ({
    label, description,
    x: focusPoint.value.x + (index % 2 ? 1 : -1) * width.value * .19 * spread,
    y: focusPoint.value.y + (index < 2 ? -1 : 1) * height.value * .18 * spread
  }))
})
const info = computed(() => activePart.value === null ? details[selected.value]?.summary : childPoints.value[activePart.value]?.description)
const relationDescriptions = Object.fromEntries(profile.sphere.map(label => [label, details[label].summary]))

function setZoom(value) {
  targetZoom = Math.max(0, Math.min(1, value))
  if (reduced.value) applyZoom(targetZoom)
}
function applyZoom(value) {
  zoom.value = value
  if (value === 0) { selected.value = null; activePart.value = null }
}
function explore(label) {
  selected.value = label
  activePart.value = null
  setZoom(1)
}
function wheel(event) {
  // A downward scroll at the overview continues the page normally.
  if (!selected.value && event.deltaY >= 0) return
  if (!selected.value) {
    const bounds = container.value.getBoundingClientRect()
    const x = event.clientX - bounds.left
    const y = event.clientY - bounds.top
    const nearest = points.value.map(point => ({ ...point, distance: Math.hypot(point.x - x, point.y - y) })).sort((a, b) => a.distance - b.distance)[0]
    if (!hovered.value && nearest.distance > 65) return
    selected.value = hovered.value || nearest.label
    activePart.value = null
  }
  event.preventDefault()
  event.stopPropagation()
  const delta = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? height.value : 1)
  setZoom(targetZoom - Math.max(-180, Math.min(180, delta)) * .006)
}
function reset() {
  const label = selected.value
  setZoom(0)
  Array.from(container.value.querySelectorAll('.tagcloud-item')).find(node => node.dataset.skill === label)?.focus({ preventScroll: true })
}
function motionChanged() { reduced.value = media.matches }
onMounted(() => {
  media = matchMedia('(prefers-reduced-motion: reduce)')
  motionChanged()
  media.addEventListener('change', motionChanged)
  resizeObserver = new ResizeObserver(([entry]) => { width.value = entry.contentRect.width; height.value = entry.contentRect.height })
  resizeObserver.observe(container.value)
  visibilityObserver = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting })
  visibilityObserver.observe(container.value)
  let last = performance.now()
  function tick(now) {
    const elapsed = Math.min(now - last, 64)
    last = now
    if (!document.hidden && visible) {
      if (!reduced.value) {
        clock.value += elapsed
        if (!selected.value && !hovered.value && !container.value.contains(document.activeElement)) angle.value += elapsed * .00018
      }
      if (Math.abs(targetZoom - zoom.value) > .001) applyZoom(zoom.value + (targetZoom - zoom.value) * Math.min(1, elapsed / 65))
      else if (zoom.value !== targetZoom) applyZoom(targetZoom)
    }
    frame = requestAnimationFrame(tick)
  }
  frame = requestAnimationFrame(tick)
})
onBeforeUnmount(() => {
  cancelAnimationFrame(frame)
  resizeObserver?.disconnect()
  visibilityObserver?.disconnect()
  media?.removeEventListener('change', motionChanged)
})
</script>

<template>
  <div ref="container" :class="['tagcloud', 'skill-network', { 'is-zoomed': zoom > .01 }]" :data-zoom="zoom.toFixed(2)" :data-selected="selected" aria-label="Interactive technology network. Scroll up over a node to explore, scroll down to return. You can also select a node with a click or Enter." @wheel="wheel" @keydown.esc.prevent="reset">
    <svg class="tagcloud-connections" :viewBox="`0 0 ${width} ${height}`" aria-hidden="true">
      <line v-for="edge in edges" :key="`${edge.from}-${edge.to}`" :data-from="edge.from" :data-to="edge.to" :data-kind="edge.kind" :data-traffic="edge.traffic" :x1="edge.start.x" :y1="edge.start.y" :x2="edge.end.x" :y2="edge.end.y" :opacity="(.08 + ((edge.start.z + edge.end.z + 2) / 4) * .2) * (1 - zoom * .15)" />
      <circle v-for="point in points" :key="point.label" :cx="point.x" :cy="point.y" r="2.5" :opacity="point.opacity" />
      <circle v-for="packet in packets" :key="packet.key" :class="['tagcloud-packet', packet.response ? 'tagcloud-packet-response' : 'tagcloud-packet-request']" :data-from="packet.from" :data-to="packet.to" :cx="packet.x" :cy="packet.y" :r="packet.radius" :opacity="packet.opacity" />
      <template v-if="selected">
        <line v-for="child in childPoints" :key="`branch-${child.label}`" class="skill-branch-line" :x1="focusPoint.x" :y1="focusPoint.y" :x2="child.x" :y2="child.y" :opacity="Math.max(0, zoom - .3) * .4" />
        <circle v-for="child in childPoints" :key="`dot-${child.label}`" :cx="child.x" :cy="child.y" r="2" :opacity="Math.max(0, zoom - .3) * .5" />
      </template>
    </svg>
    <button v-for="point in points" :key="point.label" type="button" :class="['tagcloud-item', { 'skill-focused-node': selected === point.label }]" :data-skill="point.label" :title="relationDescriptions[point.label]" :style="{ transform: `translate(-50%, -50%) translate(${point.x - width / 2}px, ${point.y - height / 2}px) scale(${point.scale})`, opacity: point.opacity, color: selected === point.label || point.z > .5 ? '#d4ff00' : '#9ca3af' }" @pointerenter="hovered = point.label" @pointerleave="hovered = null" @click="explore(point.label)">{{ point.label }}</button>
    <template v-if="selected && zoom > .4">
      <button v-for="(child, index) in childPoints" :key="`${selected}-${child.label}`" type="button" :class="['skill-child-node', { 'is-active': activePart === index }]" :style="{ left: `${child.x}px`, top: `${child.y}px`, opacity: Math.min(1, (zoom - .4) / .5) }" :title="child.description" @click="activePart = index" @focus="activePart = index">{{ child.label }}</button>
      <div class="skill-zoom-toolbar"><button type="button" class="hover-trigger" aria-label="Zoom out to skill network" @click="reset">↙ OVERVIEW</button><span>{{ Math.round(100 + zoom * 45) }}%</span></div>
      <p v-if="activePart !== null" class="skill-zoom-info" aria-live="polite">{{ info }}</p>
    </template>
  </div>
</template>

<style scoped>
.skill-network { overflow: hidden; isolation: isolate; }
.tagcloud-item { font: 700 14px 'Space Grotesk', sans-serif; }
.skill-focused-node { z-index: 3; }
.is-zoomed .skill-focused-node { text-shadow: 0 0 8px #050505, 0 0 14px #050505; }
.skill-child-node { position: absolute; transform: translate(-50%, -50%); max-width: 29%; padding: 5px; color: #b1c09f; border: 0; background: transparent; font: 10px monospace; cursor: pointer; line-height: 1.5; z-index: 2; text-shadow: 0 0 5px #050505, 0 0 10px #050505; }
.skill-child-node::before { content: ''; display: inline-block; width: 3px; height: 3px; margin: 0 5px 2px 0; border-radius: 50%; background: #a7bf83; }
.skill-child-node:hover, .skill-child-node.is-active { color: #d4ff00; }
.skill-zoom-toolbar { position: absolute; inset: 3px 8px auto; display: flex; justify-content: space-between; align-items: center; color: #77836c; font: 9px monospace; letter-spacing: 1px; }
.skill-zoom-toolbar button { padding: 8px 4px; color: #a6b793; }
.skill-zoom-info { position: absolute; bottom: 7px; left: 5%; width: 90%; color: #93a087; font-size: 11px; line-height: 1.6; text-align: center; }
.skill-zoom-hint { position: absolute; bottom: 0; left: 0; width: 100%; color: #76816c; font: 8px monospace; letter-spacing: 1px; text-align: center; pointer-events: none; }
.skill-zoom-hint > span:first-child { color: #d4ff0077; }
.skill-tap-hint { display: none; }
@media (pointer: coarse) { .skill-tap-hint { display: inline; } }
@media (max-width: 600px) { .tagcloud-item { font-size: 12px; } .skill-child-node { font-size: 9px; } }
</style>
