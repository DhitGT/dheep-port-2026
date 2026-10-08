<script setup>
import fallbackProjects from '../data/projects.json'
import profile from '../data/profile.json'
const { data: projects } = await useFetch('/api/projects', { default: () => fallbackProjects })
const featuredProjects = computed(() => projects.value.filter(project => !project.github))
const publicProjects = computed(() => projects.value.filter(project => project.github))
const { copyEmail } = usePortfolioEffects()
const goToWork = () => { window.location.hash = 'work' }
const goToAbout = () => { window.location.hash = 'about' }
const reboot = () => window.location.reload()
</script>
<template>
<div>


    <a class="skip-link" href="#work">Skip to projects</a>
    <SpotifyFloating />
<!-- NOISE OVERLAY -->
    <div class="noise-overlay"></div>

    <!-- CUSTOM CONTEXT MENU -->
    <div id="custom-context-menu">
        <div class="ctx-item" @click="goToWork"><span>OPEN_PROJECTS</span> <i class="fas fa-folder-open"></i></div>
        <div class="ctx-item" @click="goToAbout"><span>ABOUT_DEVELOPER</span> <i class="fas fa-file-alt"></i></div>
        <div class="ctx-hr"></div>
        <div class="ctx-item" @click="copyEmail"><span>COPY_CONTACT</span> <i class="fas fa-copy"></i></div>
        <div class="ctx-item" @click="reboot"><span>SYSTEM_REBOOT</span> <i class="fas fa-sync"></i></div>
    </div>

    <!-- BOOT SEQUENCE LOADER -->
    <div id="loader" class="loader-screen">
        <div class="text-xs font-mono text-gray-500 mb-4 tracking-widest">SYSTEM_BOOT_SEQUENCE_V2.0</div>
        <div class="text-6xl md:text-8xl font-display font-bold tracking-tighter" id="loader-text">0%</div>
        <div class="loader-bar-bg">
            <div id="loader-bar" class="loader-bar-fill"></div>
        </div>
        <div class="mt-4 font-mono text-xs text-[#d4ff00] h-6" id="loader-logs">INITIALIZING KERNEL...</div>
    </div>

    <!-- Cursor -->
    <div id="cursor-dot"></div>
    <div id="cursor-outline"></div>

    <!-- Back to Top (Fixed & Centered) -->
    <div id="back-to-top" role="button" tabindex="0" aria-label="Back to top">
        <span class="btt-text">SYSTEM_RECALL</span>
        <i class="fas fa-arrow-up"></i>
    </div>

    <!-- System Log (Action Logger) -->
    <div id="system-log" class="hidden md:flex">
        <div>SYS_TIME: <span id="log-time">00:00:00</span></div>
        <div>COORDS: <span id="log-coords">0, 0</span></div>
        <div>STATUS: <span id="log-status" class="log-highlight">ONLINE</span></div>
    </div>

    <!-- Achievement Toast -->
    <div id="achievement-toast" role="status" aria-live="polite">
        <div class="w-10 h-10 rounded-full bg-[#d4ff00] flex-shrink-0 flex items-center justify-center text-black text-xl">
            <i class="fas fa-trophy"></i>
        </div>
        <div id="toast-message">
            <div class="text-[#d4ff00] text-xs font-bold uppercase tracking-wider">Achievement Unlocked</div>
            <div class="text-white text-sm">Protocol Established (Email Copied)</div>
        </div>
    </div>

    <!-- HUD Scroll Progress (Bottom Right) -->
    <div id="scroll-progress-container" class="fixed bottom-8 right-8 z-[9999] hidden md:flex items-center justify-center pointer-events-none mix-blend-exclusion">
        <svg class="w-16 h-16 transform -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="4" />
            <circle id="progress-circle" cx="50" cy="50" r="45" fill="none" stroke="#d4ff00" stroke-width="4" stroke-dasharray="283" stroke-dashoffset="283" style="transition: stroke-dashoffset 0.1s linear;" />
        </svg>
        <div class="absolute text-xs font-mono font-bold text-[#d4ff00]"><span id="scroll-percent">0</span>%</div>
    </div>

    <!-- Mobile Menu Overlay -->
    <div id="mobile-menu-overlay" class="fixed inset-0 bg-black z-[60] flex flex-col justify-center items-center gap-8 md:hidden">
        <a href="#work" class="mobile-link text-4xl font-display font-bold text-white hover:text-[#d4ff00]">WORK</a>
        <a href="#loadout" class="mobile-link text-4xl font-display font-bold text-white hover:text-[#d4ff00]">LOADOUT</a>
        <a href="#process" class="mobile-link text-4xl font-display font-bold text-white hover:text-[#d4ff00]">ALGORITHM</a>
        <a href="#experience" class="mobile-link text-4xl font-display font-bold text-white hover:text-[#d4ff00]">LOGS</a>
        <a href="#lab" class="mobile-link text-4xl font-display font-bold text-white hover:text-[#d4ff00]">LAB</a>
        <a href="#contact" class="mobile-link text-4xl font-display font-bold text-white hover:text-[#d4ff00]">CONTACT</a>
    </div>

    <!-- Nav -->
    <nav id="navbar" class="fixed top-0 left-0 w-full z-[70] px-6 py-6 flex justify-between items-center mix-blend-difference transition-transform duration-300">
        <a href="#" class="text-2xl font-bold font-display tracking-tighter hover-trigger scramble-text" :data-value="profile.brand">{{ profile.brand }}</a>
        
        <!-- Desktop Menu -->
        <div class="hidden md:flex gap-8 text-sm uppercase tracking-widest font-bold">
            <a href="#work" class="hover-trigger hover:text-[#d4ff00] transition-colors">Work</a>
            <a href="#loadout" class="hover-trigger hover:text-[#d4ff00] transition-colors">Loadout</a>
            <a href="#process" class="hover-trigger hover:text-[#d4ff00] transition-colors">Algorithm</a>
            <a href="#experience" class="hover-trigger hover:text-[#d4ff00] transition-colors">Logs</a>
            <a href="#lab" class="hover-trigger hover:text-[#d4ff00] transition-colors">Lab</a>
            <a href="#contact" class="hover-trigger hover:text-[#d4ff00] transition-colors">Contact</a>
        </div>

        <!-- Mobile Menu Button -->
        <button id="menu-btn" aria-label="Toggle navigation" aria-controls="mobile-menu-overlay" aria-expanded="false" class="md:hidden text-2xl hover-trigger text-white z-[70]">
            <i class="fas fa-bars"></i>
        </button>
    </nav>

    <main id="smooth-wrapper">
        <div id="smooth-content">

            <!-- HERO SECTION -->
            <section class="min-h-screen flex items-center justify-center relative px-6 overflow-hidden pt-20 md:pt-0">
                <!-- Interactive Warp Grid Canvas -->
                <canvas id="hero-grid"></canvas>
                
                <div class="relative z-10 w-full max-w-7xl grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
                    <div class="order-2 md:order-1">
                        <div class="inline-block px-3 py-1 border border-white/20 rounded-full text-xs uppercase tracking-[0.2em] mb-6 text-[#d4ff00]">
                            Based in {{ profile.location }}
                        </div>
                        <h1 class="hero-title font-display font-bold leading-none mb-6 text-white glitch-wrapper">
                            <span class="glitch" data-text="BUILD">BUILD</span> <br>
                            <span class="text-transparent bg-clip-text bg-gradient-to-r from-white to-[#555]">SYSTEMS</span>
                        </h1>
                        <p class="text-lg md:text-xl text-gray-400 max-w-md mb-10 leading-relaxed">
                            I'm <span class="text-white font-bold">{{ profile.nickname }}</span>, a Software Developer building modern web applications, real-time communication, and reliable enterprise systems.
                        </p>
                        <div class="flex flex-wrap gap-4">
                            <a href="#work" class="hover-trigger bg-white text-black px-6 md:px-8 py-3 md:py-4 font-bold uppercase tracking-wider hover:bg-[#d4ff00] transition-colors skew-x-[-10deg] inline-block">
                                <span class="skew-x-[10deg] inline-block">View Projects</span>
                            </a>
                            <a href="#about" class="hover-trigger border border-white px-6 md:px-8 py-3 md:py-4 font-bold uppercase tracking-wider hover:bg-white hover:text-black transition-colors skew-x-[-10deg] inline-block">
                                <span class="skew-x-[10deg] inline-block">About Me</span>
                            </a>
                        </div>
                    </div>

                    <!-- 3D Interactive Sphere -->
                    <div class="h-[40vh] md:h-[50vh] flex items-center justify-center relative order-1 md:order-2">
                        <div class="tagcloud text-sm md:text-base font-bold text-gray-400"></div>
                        <div class="absolute w-64 h-64 bg-[#d4ff00] rounded-full blur-[120px] opacity-20 -z-10 animate-pulse"></div>
                    </div>
                </div>
                
                <div class="hero-scroll-hint absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-50" aria-hidden="true">
                    <span class="text-[10px] tracking-[0.3em] uppercase">Scroll</span>
                    <div class="w-[1px] h-12 bg-gradient-to-b from-white to-transparent"></div>
                </div>
            </section>

            <!-- MARQUEE -->
            <div class="py-6 md:py-8 bg-[#d4ff00] text-black overflow-hidden rotate-[-2deg] scale-105 border-y-4 border-black z-20 relative hover-trigger">
                <div class="marquee-container">
                    <div class="marquee-content font-display font-bold text-3xl md:text-6xl tracking-tighter">
                        FRONTEND • FULL-STACK • REALTIME • OFFLINE-FIRST • SYSTEM DESIGN • CREATIVE DEV • FRONTEND • FULL-STACK • REALTIME • OFFLINE-FIRST • SYSTEM DESIGN • CREATIVE DEV •
                    </div>
                </div>
            </div>

            <!-- SELECTED WORKS -->
            <section id="work" class="relative bg-[#0a0a0a] pt-32 pb-20 px-4 md:px-10">
                <div class="max-w-7xl mx-auto mb-16">
                    <h2 class="text-4xl md:text-6xl font-display font-bold">SELECTED <span class="text-[#d4ff00]">MISSIONS</span></h2>
                    <p class="text-gray-500 mt-4 max-w-md">Enterprise software. Real engineering challenges. Selected contributions.</p>
                </div>

                <div class="work-stack-wrapper max-w-7xl mx-auto">
  <ProjectCard v-for="project in featuredProjects" :key="project.id" :project="project" />
</div>


                <div class="mt-20 text-center">
                     <a href="https://github.com/DhitGT" target="_blank" rel="noopener noreferrer" class="hover-trigger px-8 py-4 border border-[#d4ff00] text-[#d4ff00] font-bold uppercase tracking-widest hover:border-[#d4ff00] hover:text-[#d4ff00] transition-all skew-x-[-10deg] inline-block">
                        <span class="skew-x-[10deg] inline-block">Explore My GitHub <i class="fas fa-external-link-alt ml-2"></i></span>
                    </a>
                </div>
            </section>

            <!-- THE LOADOUT -->
            <section id="loadout" class="py-20 px-6 bg-[#050505]">
  <div class="max-w-7xl mx-auto">
    <h2 class="text-4xl md:text-5xl font-display font-bold mb-6">TECHNICAL <span class="text-[#d4ff00]">LOADOUT</span></h2>
    <p class="text-gray-500 mb-10 max-w-2xl">The tools behind my work. Proficiency reflects hands-on experience and self-assessment.</p>
    <div class="inventory-grid">
      <div v-for="skill in profile.loadout" :key="skill.name" class="inventory-slot hover-trigger group" :class="'rarity-' + skill.rarity">
        <div class="flex justify-between items-start mb-4"><span class="skill-level font-mono text-xs uppercase">{{ skill.level }}</span><i :class="skill.icon" class="text-2xl text-white" aria-hidden="true"></i></div>
        <h3 class="font-display text-lg font-bold mb-2">{{ skill.name }}</h3>
        <p class="text-xs text-[#d4ff00] mb-3">{{ skill.category }}</p>
        <p class="text-sm text-gray-400 leading-relaxed">{{ skill.tools }}</p>
      </div>
    </div>
    <div class="mt-12 pt-8 border-t border-white/10">
      <h3 class="font-mono text-xs text-gray-500 uppercase tracking-widest mb-5">Engineering & Development Tools</h3>
      <div class="flex flex-wrap gap-3"><span v-for="skill in profile.engineering" :key="skill.name" class="engineering-skill">{{ skill.name }} <span>{{ skill.level }}</span></span></div>
    </div>
  </div>
</section>

            <!-- THE ALGORITHM -->
            <section id="process" class="py-24 px-6 bg-[#0a0a0a] relative overflow-hidden">
  <canvas id="algo-canvas"></canvas>
  <div class="max-w-6xl mx-auto relative z-10">
    <h2 class="text-4xl md:text-5xl font-display font-bold mb-16 text-center">THE <span class="text-[#d4ff00]">ALGORITHM</span></h2>
    <div class="algo-grid">
      <div v-for="(step, index) in profile.process" :key="step.title" class="algo-card hover-trigger group">
        <div class="algo-header"><span>&gt; EXECUTE_PHASE_0{{ index + 1 }}</span><span class="text-[#d4ff00]">●</span></div>
        <div class="algo-body"><h3 class="text-2xl text-white font-bold mb-3 group-hover:text-[#d4ff00] transition-colors">{{ step.title }}</h3><p class="text-xs font-mono text-[#d4ff00] mb-3">// {{ step.comment }}</p><p class="text-gray-400 text-sm leading-relaxed">{{ step.description }}</p></div>
      </div>
    </div>
  </div>
</section>

            <!-- MISSION LOGS -->
            <section id="experience" class="py-20 px-6 bg-[#050505]">
  <div class="max-w-4xl mx-auto">
    <h2 class="text-4xl md:text-5xl font-display font-bold mb-12">MISSION <span class="text-[#d4ff00]">LOGS</span></h2>
    <div class="space-y-12 border-l border-white/10 ml-4 pl-8 relative">
      <div class="absolute left-0 top-0 h-full w-[1px] bg-gradient-to-b from-[#d4ff00] to-transparent"></div>
      <article v-for="entry in profile.experience" :key="entry.title" class="mission-log hover-trigger" :class="{ 'mission-active': entry.active }">
        <span class="text-xs font-mono text-[#d4ff00] mb-2 block tracking-widest">{{ entry.period }}</span>
        <h3 class="text-2xl md:text-3xl font-bold text-white mb-1">{{ entry.title }}</h3>
        <div class="text-sm font-mono text-gray-400 mb-4 uppercase">{{ entry.organization }}</div>
        <p class="text-gray-400 leading-relaxed text-sm md:text-base">{{ entry.description }}</p>
        <ul v-if="entry.highlights.length" class="experience-highlights mt-4 space-y-2 text-sm text-gray-500"><li v-for="highlight in entry.highlights" :key="highlight">{{ highlight }}</li></ul>
        <p v-if="entry.note" class="text-xs font-mono text-[#d4ff00] mt-4">{{ entry.note }}</p>
      </article>
    </div>
  </div>
</section>

            <!-- MANIFESTO -->
            <section id="manifesto" class="py-20 bg-black overflow-hidden">
  <div class="whitespace-nowrap flex overflow-hidden mb-8">
    <div v-for="copy in 2" :key="copy" class="animate-marquee inline-block" :aria-hidden="copy === 2 ? 'true' : undefined"><span class="text-[4rem] md:text-[8rem] font-display font-bold uppercase text-white px-4">Solve Problems.</span><span class="text-[4rem] md:text-[8rem] font-display font-bold uppercase outline-text px-4">Build Systems.</span></div>
  </div>
  <p class="max-w-3xl mx-auto px-6 mt-12 text-center text-lg md:text-2xl text-gray-400 font-light leading-relaxed">Reliable software starts with clear thinking. I care about interfaces that feel responsive, code that stays maintainable, and technology that solves <span class="text-[#d4ff00]">real-world problems</span>.</p>
</section>

            <!-- ABOUT -->
            <section id="about" class="py-24 px-6 bg-[#0a0a0a]">
  <div class="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
    <div class="glass-card developer-about-card md:col-span-2 p-8 md:p-12 hover-trigger">
      <div class="developer-about-layout">
        <figure class="developer-portrait">
          <div class="developer-portrait-glow" aria-hidden="true"></div>
          <img class="developer-headshot" src="/images/aditya-headshot.png" :alt="`Portrait of ${profile.name}`" width="1122" height="1402" loading="lazy" decoding="async">
          <figcaption class="developer-portrait-caption"><span>{{ profile.nickname }}</span><span>{{ profile.role }}</span></figcaption>
        </figure>
        <div class="developer-about-copy">
      <p class="text-gray-400 text-xs tracking-widest uppercase mb-4">The Developer / About Me</p>
      <h2 class="text-2xl md:text-3xl font-bold text-white mb-3">{{ profile.name }}</h2>
      <p class="text-[#d4ff00] text-sm mb-6">{{ profile.role }} · {{ profile.specialization }}</p>
      <p v-for="paragraph in profile.bio" :key="paragraph" class="text-gray-400 leading-relaxed mb-4">{{ paragraph }}</p>
        </div>
      </div>
    </div>
    <div class="glass-card p-8 hover-trigger">
      <p class="text-xs font-mono text-[#d4ff00] mb-8"><span class="animate-pulse">●</span> LIVE STATUS</p>
      <div class="space-y-6">
        <div><p class="text-gray-500 text-xs uppercase mb-2">Current Mission</p><p class="text-lg font-bold">{{ profile.company }}</p></div>
        <div><p class="text-gray-500 text-xs uppercase mb-2">Location</p><p class="font-bold">{{ profile.location }}</p></div>
        <div><p class="text-gray-500 text-xs uppercase mb-2">Exploring</p><p class="font-bold">Software architecture & system design</p></div>
        <div><p class="text-gray-500 text-xs uppercase mb-2">Availability</p><p class="text-[#d4ff00] font-bold">Open to opportunities & collaboration</p></div>
      </div>
    </div>
  </div>
</section>

            <!-- THE BREAK ROOM -->
            <section id="playground" class="py-20 px-6 bg-[#0a0a0a]">
                <div class="max-w-7xl mx-auto">
                    <div class="flex flex-col md:flex-row justify-between items-end mb-6">
                        <h2 class="text-3xl md:text-4xl font-display font-bold">THE <span class="text-[#d4ff00]">BREAK ROOM</span></h2>
                        <p class="text-xs font-mono text-gray-400 uppercase tracking-widest hidden md:block">Interactive Physics / Matter.js</p>
                    </div>
                    <p class="text-gray-500 mb-8 max-w-lg">Drag, throw, and crash the skills. A little chaos engine for your entertainment.</p>
                    <div id="physics-canvas" class="rounded-lg overflow-hidden relative hover-trigger">
                        <div class="absolute top-4 right-4 flex flex-wrap gap-2 z-10 pointer-events-auto">
                             <button id="phy-gravity" class="px-3 py-1 bg-black/50 border border-white/20 text-xs font-mono text-white hover:text-[#d4ff00] hover:border-[#d4ff00] transition-colors backdrop-blur-sm">GRAVITY: ON</button>
                             <button id="phy-add" class="px-3 py-1 bg-black/50 border border-white/20 text-xs font-mono text-white hover:text-[#d4ff00] hover:border-[#d4ff00] transition-colors backdrop-blur-sm">ADD +</button>
                             <button id="phy-restart" aria-label="Reset playground" class="px-3 py-1 bg-black/50 border border-white/20 text-xs font-mono text-white hover:text-[#d4ff00] hover:border-[#d4ff00] transition-colors backdrop-blur-sm"><i class="fas fa-undo"></i></button>
                        </div>
                        <div class="absolute top-4 left-4 text-xs font-mono text-gray-500 z-10 pointer-events-none">INTERACTIVE ZONE</div>
                    </div>
                </div>
            </section>

            <!-- SIDE QUESTS -->
            <section id="lab" class="py-20 px-6 bg-[#0a0a0a]">
  <div class="max-w-7xl mx-auto">
    <div class="flex justify-between items-end mb-6"><h2 class="text-4xl md:text-5xl font-display font-bold">SIDE <span class="text-[#d4ff00]">QUESTS</span></h2><p class="text-xs font-mono text-gray-400 uppercase tracking-widest hidden md:block">Personal / Public GitHub</p></div>
    <p class="text-gray-500 mb-10">Personal projects in browser interaction and full-stack fundamentals.</p>
    <div class="grid md:grid-cols-2 gap-6"><PublicProjectCard v-for="project in publicProjects" :key="project.id" :project="project" /></div>
    <div class="mt-12 text-center"><a href="https://github.com/DhitGT" target="_blank" rel="noopener noreferrer" class="hover-trigger px-8 py-4 border border-white/20 text-white font-bold uppercase tracking-widest hover:border-[#d4ff00] hover:text-[#d4ff00] transition-all inline-block">Explore GitHub <i class="fab fa-github ml-2" aria-hidden="true"></i></a></div>
  </div>
</section>

            <!-- FOOTER -->
            <footer id="contact" class="py-24 px-6 bg-[#d4ff00] text-black relative overflow-hidden">
                <div class="max-w-7xl mx-auto text-center relative z-10">
                    <h2 class="text-5xl md:text-9xl font-display font-bold tracking-tighter mb-8 hover-trigger scramble-text" data-value="LET'S TALK">LET'S TALK</h2>
                    <div class="flex flex-col md:flex-row justify-center items-center gap-8 mt-12">
                        <button @click="copyEmail" id="magnetic-btn" class="hover-trigger px-8 py-4 bg-black text-white font-bold uppercase tracking-widest hover:scale-105 transition-transform skew-x-[-10deg] relative overflow-hidden group">
                            <span class="relative z-10 skew-x-[10deg] inline-block">{{ profile.email }}</span>
                            <div class="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out"></div>
                        </button>
                        <div class="flex gap-6 text-2xl"><a v-for="social in profile.socials" :key="social.name" :href="social.url" :aria-label="social.name" target="_blank" rel="noopener noreferrer" class="hover-trigger hover:scale-125 transition-transform"><i :class="social.icon" aria-hidden="true"></i></a></div>
                    </div>
                    <ContactForm />
<div class="mt-20 flex flex-col md:flex-row justify-between items-center text-xs font-mono opacity-80 border-t border-black/20 pt-8">
                        <div>BEKASI, INDONESIA • &copy; {{ new Date().getFullYear() }} {{ profile.name }}</div>
                        <div class="flex items-center gap-4 mt-4 md:mt-0">
                            <span id="time-display">00:00:00 WIB</span>
                            <span>OPEN TO OPPORTUNITIES</span>
                            <span class="flex items-center gap-1"><span class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span> ONLINE</span>
                        </div>
                    </div>
                </div>
                <div class="absolute inset-0 opacity-10 noise-overlay" style="position:absolute;z-index:0"></div>
            </footer>

        </div>
    </main>

    
</div>
</template>
