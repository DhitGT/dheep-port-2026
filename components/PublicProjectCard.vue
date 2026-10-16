<script setup>
const props = defineProps({ project: { type: Object, required: true } })
const expanded = ref(false)
const detailId = computed(() => `sidequest-details-${props.project.id}`)
</script>
<template>
  <article class="public-project-card group">
    <a :href="project.github" target="_blank" rel="noopener noreferrer" class="public-project-image hover-trigger" :aria-label="`View ${project.title.join(' ')} repository`">
      <img :src="project.image" :alt="project.imageAlt || `${project.title.join(' ')} repository preview`" loading="lazy" width="1280" height="800">
      <span class="public-project-badge"><i class="fab fa-github" aria-hidden="true"></i> PUBLIC REPOSITORY</span>
    </a>
    <div class="public-project-header p-6 md:p-8">
      <div class="min-w-0">
        <p class="font-mono text-xs text-[#d4ff00] mb-3">{{ project.label }}</p>
        <h3 class="font-display text-xl md:text-2xl font-bold">{{ project.title.join(' ') }}</h3>
      </div>
      <button type="button" class="public-project-toggle hover-trigger" :aria-expanded="expanded" :aria-controls="detailId" :aria-label="`${expanded ? 'Collapse' : 'Expand'} ${project.title.join(' ')} details`" @click="expanded = !expanded">
        <span>{{ expanded ? 'Less' : 'Details' }}</span><i :class="['fas fa-chevron-down', { 'is-expanded': expanded }]" aria-hidden="true"></i>
      </button>
    </div>
    <div class="public-project-stack flex flex-wrap gap-2 px-6 pb-6 md:px-8 md:pb-8"><span v-for="tag in project.tags" :key="tag" class="px-3 py-1 border border-white/20 rounded-full text-xs text-gray-300">{{ tag }}</span></div>
    <div v-show="expanded" :id="detailId" class="public-project-details">
    <div class="px-6 pb-6 md:px-8 md:pb-8">
      <p v-if="project.projectType" class="text-xs text-gray-500 leading-relaxed mb-4">{{ project.projectType }} · {{ project.role }}</p>
      <p class="text-gray-400 leading-relaxed text-sm mb-5">{{ project.description }}</p>
      <ul v-if="project.features" class="space-y-3 mb-6 text-sm leading-relaxed">
        <li v-for="feature in project.features" :key="feature.title">
          <strong class="block font-medium text-gray-300">{{ feature.title }}</strong>
          <span class="text-gray-400">{{ feature.description }}</span>
        </li>
      </ul>
      <div class="flex flex-wrap gap-4 text-xs font-bold uppercase tracking-widest">
        <a :href="project.github" target="_blank" rel="noopener noreferrer" class="public-project-link hover-trigger"><i class="fab fa-github" aria-hidden="true"></i> View source <i class="fas fa-arrow-up-right-from-square" aria-hidden="true"></i></a>
        <a v-if="project.url" :href="project.url" target="_blank" rel="noopener noreferrer" class="public-project-link hover-trigger">{{ project.demoLabel || 'Play game' }} <i class="fas fa-arrow-right" aria-hidden="true"></i></a>
      </div>
      <p class="text-gray-600 text-xs mt-5">{{ project.imageCaption }}</p>
    </div>
    </div>
  </article>
</template>
