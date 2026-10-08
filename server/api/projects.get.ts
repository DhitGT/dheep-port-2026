import fallbackProjects from '../../../data/projects.json'

export default defineEventHandler(async (event) => {
  const { apiBase } = useRuntimeConfig(event)
  try {
    return await $fetch(`${apiBase}/projects`, { timeout: 2500 })
  } catch {
    // The portfolio remains readable while the Laravel service is starting.
    return fallbackProjects
  }
})
