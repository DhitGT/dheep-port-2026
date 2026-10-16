<script setup>
const active = ref('physics')
const mobileViews = reactive({ physics: false, merge: false, bugs: false, color: false, typing: false })
const visited = ref(new Set(['physics']))
const tabs = [
  { id: 'physics', name: 'Physics Lab', icon: 'fas fa-cubes', note: 'Throw things around' },
  { id: 'merge', name: 'Stack Merge', icon: 'fas fa-code-merge', note: 'Tiny bits. Big builds.' },
  { id: 'bugs', name: 'Bug Hunt', icon: 'fas fa-bug', note: 'Patch fast. Ship clean.' },
  { id: 'color', name: 'Color Match', icon: 'fas fa-palette', note: 'Trust your color memory.' },
  { id: 'typing', name: 'Typing Sprint', icon: 'fas fa-keyboard', note: 'Find your coding flow.' }
]
function select(id) { active.value = id; visited.value.add(id) }
function navigate(event, index) {
  let next
  if (event.key === 'ArrowRight') next = (index + 1) % tabs.length
  else if (event.key === 'ArrowLeft') next = (index + tabs.length - 1) % tabs.length
  else if (event.key === 'Home') next = 0
  else if (event.key === 'End') next = tabs.length - 1
  else return
  event.preventDefault()
  select(tabs[next].id)
  document.getElementById(`arcade-tab-${tabs[next].id}`).focus()
}
</script>

<template>
  <div :class="['break-room-arcade', { 'arcade-in-game': mobileViews[active] }]">
    <div class="arcade-tabs" role="tablist" aria-label="Break Room games">
      <button v-for="(tab, index) in tabs" :id="`arcade-tab-${tab.id}`" :key="tab.id" type="button" role="tab" :aria-selected="active === tab.id" :aria-controls="`arcade-panel-${tab.id}`" :tabindex="active === tab.id ? 0 : -1" :class="['arcade-tab', 'hover-trigger', { 'is-active': active === tab.id }]" @click="select(tab.id)" @keydown="navigate($event, index)">
        <span class="arcade-tab-index">0{{ index + 1 }}</span><i :class="tab.icon" aria-hidden="true"></i><span><strong>{{ tab.name }}</strong><small>{{ tab.note }}</small></span><span v-if="tab.id !== 'physics'" class="arcade-new">NEW</span>
      </button>
    </div>
    <div id="arcade-panel-physics" v-show="active === 'physics'" role="tabpanel" aria-labelledby="arcade-tab-physics">
      <div class="arcade-physics-menu arcade-game"><p class="arcade-eyebrow">01 / NO RULES. JUST PHYSICS.</p><h3>Make a little <span class="text-[#d4ff00]">chaos.</span></h3><p class="arcade-description">Drag, throw, and crash the skills. Turn gravity off, add more blocks, and see what happens.</p><button type="button" class="arcade-button mt-6" @click="mobileViews.physics = true">Play Physics Lab</button></div>
      <div :class="['arcade-physics-play', { 'mobile-playing': mobileViews.physics }]"><div class="arcade-mobile-toolbar"><div class="arcade-mobile-topline"><button type="button" @click="mobileViews.physics = false">← MENU</button><strong>PHYSICS LAB</strong></div></div><slot /></div>
    </div>
    <div id="arcade-panel-merge" v-show="active === 'merge'" role="tabpanel" aria-labelledby="arcade-tab-merge"><StackMergeGame v-if="visited.has('merge')" :active="active === 'merge'" @view-change="mobileViews.merge = $event" /></div>
    <div id="arcade-panel-bugs" v-show="active === 'bugs'" role="tabpanel" aria-labelledby="arcade-tab-bugs"><BugHuntGame v-if="visited.has('bugs')" :active="active === 'bugs'" @view-change="mobileViews.bugs = $event" /></div>
    <div id="arcade-panel-color" v-show="active === 'color'" role="tabpanel" aria-labelledby="arcade-tab-color"><ColorMatchGame v-if="visited.has('color')" :active="active === 'color'" @view-change="mobileViews.color = $event" /></div>
    <div id="arcade-panel-typing" v-show="active === 'typing'" role="tabpanel" aria-labelledby="arcade-tab-typing"><TypingSprintGame v-if="visited.has('typing')" :active="active === 'typing'" @view-change="mobileViews.typing = $event" /></div>
  </div>
</template>

<style>
.arcade-tabs { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 10px; margin-bottom: 20px; }
.arcade-tab { display: flex; align-items: center; gap: 16px; padding: 20px; text-align: left; background: #10110e; border: 1px solid #ffffff12; border-radius: 10px; color: #89917e; transition: border-color .2s, background .2s; }
.arcade-tab:hover { border-color: #d4ff0044; }
.arcade-tab.is-active { background: #d4ff0008; border-color: #d4ff0066; color: #d4ff00; }
.arcade-tab-index { font: 9px monospace; opacity: .5; }
.arcade-tab > i { font-size: 19px; }
.arcade-tab strong { display: block; font-size: 14px; color: #dde2d5; }
.arcade-tab small { display: block; font-size: 10px; color: #77816b; margin-top: 5px; }
.arcade-new { margin-left: auto; font: 8px monospace; color: #a2ba78; letter-spacing: 1px; }
.arcade-game { padding: 28px; background: #0d100c; border: 1px solid #ffffff12; border-radius: 14px; }
.arcade-eyebrow { font: 9px monospace; letter-spacing: 2px; color: #89977a; text-transform: uppercase; }
.arcade-game h3 { font-size: clamp(25px, 4vw, 36px); font-weight: 700; letter-spacing: -1px; margin: 10px 0; }
.arcade-description { color: #89947d; font-size: 13px; line-height: 1.8; max-width: 420px; }
.arcade-button { padding: 12px 18px; border: 1px solid #d4ff0055; background: #d4ff00; color: #101408; font: bold 10px monospace; letter-spacing: 1px; text-transform: uppercase; cursor: pointer; }
.arcade-button:disabled { opacity: .35; cursor: default; }
.arcade-button-secondary { background: transparent; color: #aebd9b; border-color: #ffffff22; }
.arcade-stats { display: flex; flex-wrap: wrap; gap: 24px; margin: 24px 0; }
.arcade-stats dt { font: 8px monospace; letter-spacing: 1.5px; color: #7c886e; text-transform: uppercase; }
.arcade-stats dd { font: 700 24px 'Space Grotesk', sans-serif; color: #e4ecd9; margin-top: 4px; }
.arcade-stats dd.accent { color: #d4ff00; }
.arcade-note { color: #75806a; font: 10px monospace; line-height: 1.8; }
.arcade-mobile-only, .arcade-mobile-toolbar, .arcade-physics-menu { display: none; }
@media (max-width: 1450px) { .arcade-new { display: none; } .arcade-tab-index { display: none; } .arcade-tab { gap: 10px; padding: 18px 12px; } }
@media (min-width: 701px) and (max-width: 1150px) { .arcade-tab { padding: 16px 10px; gap: 10px; } .arcade-tab-index, .arcade-new { display: none; } .arcade-tab small { font-size: 9px; } }
@media (max-width: 800px) {
  .arcade-in-game .arcade-tabs { position: sticky; top: 68px; z-index: 30; padding: 8px 0; background: #0a0a0af5; backdrop-filter: blur(8px); }
  .arcade-mobile-only, .arcade-mobile-toolbar, .arcade-physics-menu { display: block; }
  .arcade-physics-play { display: none; }
  .arcade-physics-play.mobile-playing { display: block; }
  .arcade-in-game .arcade-physics-menu { display: none; }
  .arcade-mobile-toolbar { margin-bottom: 12px; }
  .arcade-mobile-topline { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 16px; }
  .arcade-mobile-topline > button { color: #a4b68b; padding: 8px 0; font: 9px monospace; letter-spacing: 1px; }
  .arcade-mobile-topline strong { color: #c6d2ba; font: 10px monospace; letter-spacing: 1px; }
  .arcade-mobile-stats { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin: 0 0 12px; }
  .arcade-mobile-stats dt { font: 8px monospace; letter-spacing: 1px; color: #77876a; text-transform: uppercase; }
  .arcade-mobile-stats dd { color: #d4ff00; font: 700 22px 'Space Grotesk', sans-serif; margin-top: 3px; }
  .arcade-mobile-actions { display: flex; align-items: center; gap: 8px; }
  .arcade-mobile-actions button { color: #a9ba95; font: 9px monospace; border: 1px solid #ffffff1a; padding: 9px 10px; }
  .arcade-mobile-actions .arcade-button { background: #d4ff00; color: #101408; }
  #playground:has(.arcade-in-game) > div > p { display: none; }
  #playground:has(.arcade-in-game) { padding-top: 24px; padding-bottom: 32px; }
  #playground:has(.arcade-in-game) h2 { font-size: 20px; }
  #playground .arcade-physics-play #physics-canvas { height: min(65svh, 520px); min-height: 300px; }
  #playground .arcade-physics-play #physics-canvas > .left-4 { display: none; }
}
@media (max-width: 700px) {
  .arcade-tabs { gap: 6px; }
  .arcade-tab { padding: 14px 6px; gap: 6px; flex-direction: column; text-align: center; }
  .arcade-tab-index, .arcade-tab small, .arcade-new { display: none; }
  .arcade-tab > i { font-size: 15px; }
  .arcade-tab strong { font-size: 9px; margin-top: 4px; }
  .arcade-game { padding: 18px; }
}
</style>
