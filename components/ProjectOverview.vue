<script setup>
const props = defineProps({ type: { type: String, required: true } })
const views = {
  communication: { icon: 'fas fa-satellite-dish', title: 'CONNECTED SYSTEMS', subtitle: 'Messaging · Meetings · State sync', nodes: ['CLIENT UI', 'EVENT LAYER', 'LIVE SESSIONS'], detail: 'Socket.IO / WebRTC / LiveKit' },
  storage: { icon: 'fas fa-database', title: 'LOCAL-FIRST DATA', subtitle: 'Persistence · Encryption · Background work', nodes: ['APP STATE', 'WORKER', 'LOCAL STORE'], detail: 'SQLite / OPFS / AES-GCM' },
  access: { icon: 'fas fa-shield-alt', title: 'PERMISSION-AWARE UI', subtitle: 'Modules · Roles · Navigation', nodes: ['ACCESS RIGHTS', 'EVALUATION', 'UI ACTIONS'], detail: 'Routes / Features / User interfaces' }
}
const view = computed(() => views[props.type] || views.communication)
</script>
<template>
  <div class="project-overview" :aria-label="`${view.title}: conceptual overview of a private project`" role="img">
    <span class="overview-label">PRIVATE PROJECT / CONCEPTUAL OVERVIEW</span>
    <div class="overview-orbit"><i :class="view.icon" aria-hidden="true"></i></div>
    <h4>{{ view.title }}</h4>
    <p class="overview-subtitle">{{ view.subtitle }}</p>
    <div class="overview-nodes"><span v-for="node in view.nodes" :key="node">{{ node }}</span></div>
    <p class="overview-detail">{{ view.detail }}</p>
    <p class="overview-caption"><i class="fas fa-lock" aria-hidden="true"></i> Internal application · Visual overview</p>
  </div>
</template>
