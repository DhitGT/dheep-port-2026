import profile from '../data/profile.json'

export default defineNuxtConfig({
  compatibilityDate: '2026-10-08',
  srcDir: '.',
  devServer: { port: 3030 },
  devtools: { enabled: false },
  telemetry: false,
  nitro: { externals: { inline: ['nuxt'] } },
  css: ['~/assets/css/fonts.css', '@fortawesome/fontawesome-free/css/all.min.css', '~/assets/css/main.css'],
  postcss: { plugins: { tailwindcss: {}, autoprefixer: {} } },
  runtimeConfig: { apiBase: process.env.NUXT_API_BASE || 'http://127.0.0.1:8000/api' },
  app: {
    head: {
      title: `${profile.name} | ${profile.role}`,
      htmlAttrs: { lang: 'en', class: 'antialiased' },
      bodyAttrs: { class: 'selection:bg-[#d4ff00] selection:text-black' },
      meta: [
        { name: 'description', content: profile.bio[0] },
        { property: 'og:title', content: `${profile.name} | ${profile.role}` },
        { property: 'og:description', content: profile.bio[0] },
        { property: 'og:type', content: 'website' }
      ],
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }
      ]
    }
  }
})
