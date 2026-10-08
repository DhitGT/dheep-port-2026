export default defineEventHandler(async (event) => {
  const { apiBase } = useRuntimeConfig(event)
  if (!apiBase) {
    setResponseStatus(event, 503)
    return { message: 'Contact service unavailable.' }
  }
  const body = await readBody(event)
  try {
    const response = await $fetch.raw(`${apiBase}/contact`, {
      method: 'POST', body, timeout: 10000,
      headers: { Accept: 'application/json' }
    })
    setResponseStatus(event, response.status)
    return response._data
  } catch (error: any) {
    const status = error.response?.status || 503
    setResponseStatus(event, status)
    return error.data || { message: 'Contact service unavailable.' }
  }
})
