import { inject } from '@vercel/analytics'

export default defineNuxtPlugin(() => {
  onNuxtReady(() => {
    inject()
  })
})
