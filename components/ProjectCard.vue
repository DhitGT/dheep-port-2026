<script setup>
defineProps({ project: { type: Object, required: true } })
</script>

<template>
  <div class="project-card-stack group project-trigger">
    <article class="mission-wrapper">
      <div class="mission-inner">
        <div class="mission-content">
          <div class="text-[#d4ff00] font-mono text-xs uppercase tracking-widest mb-4">{{ project.label }}</div>
          <h3 class="project-card-title font-display font-bold leading-tight mb-5">
            <span v-for="line in project.title" :key="line" class="project-title-line">{{ line }}</span>
          </h3>
          <p class="text-gray-400 text-sm md:text-base leading-relaxed mb-4">{{ project.description }}</p>
          <p class="text-xs text-[#d4ff00] font-mono mb-4">{{ project.role }}</p>
          <div class="flex flex-wrap gap-2 mb-8">
            <span v-for="tag in project.tags" :key="tag" class="px-3 py-1 border border-white/20 rounded-full text-xs text-gray-300">{{ tag }}</span>
          </div>
          <a v-if="project.url" :href="project.url" target="_blank" rel="noopener noreferrer" class="mission-arrow hover-trigger" :aria-label="`View ${project.title.join(' ')} case study`"><i class="fas fa-arrow-right" aria-hidden="true"></i></a>
          <ul class="project-highlights text-sm text-gray-400 space-y-2 mb-4">
            <li v-for="highlight in project.highlights" :key="highlight">{{ highlight }}</li>
          </ul>
          <span v-if="!project.url" class="text-xs font-mono text-gray-500 flex items-center gap-2"><i class="fas fa-lock" aria-hidden="true"></i>{{ project.visibility }}</span>
        </div>
        <div class="mission-img-box">
          <template v-if="project.image">
            <div class="mission-gradient"></div>
            <img :src="project.image" :alt="project.title.join(' ')" class="mission-img" loading="lazy">
          </template>
          <ProjectOverview v-else :type="project.overview" />
        </div>
      </div>
    </article>
  </div>
</template>
