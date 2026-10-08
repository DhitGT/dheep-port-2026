<script setup>
const form = reactive({ name: '', email: '', message: '', website: '' })
const busy = ref(false)
const status = ref('')
const succeeded = ref(false)
const errors = ref({})
async function submit() {
  if (busy.value) return
  busy.value = true
  status.value = ''
  succeeded.value = false
  errors.value = {}
  try {
    await $fetch('/api/contact', { method: 'POST', body: form })
    succeeded.value = true
    status.value = 'TRANSMISSION RECEIVED. Your message has been saved.'
    Object.assign(form, { name: '', email: '', message: '', website: '' })
  } catch (error) {
    errors.value = error.data?.errors || {}
    status.value = error.status === 422 ? 'Please check the highlighted fields.' : error.status === 429 ? 'Too many transmissions. Please try again in a minute.' : 'Connection unavailable. Please try again or use the email button above.'
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <form class="max-w-2xl mx-auto mt-16 text-left" @submit.prevent="submit">
    <p class="text-xs font-mono uppercase tracking-widest mb-6">ESTABLISH A CONNECTION / SEND A MESSAGE</p>
    <div class="grid sm:grid-cols-2 gap-5">
      <div>
        <label for="contact-name" class="block text-xs font-bold uppercase mb-2">Name</label>
        <input id="contact-name" v-model="form.name" class="contact-input" required maxlength="100" autocomplete="name" placeholder="Your name" :aria-invalid="!!errors.name" aria-describedby="name-error">
        <p id="name-error" class="text-sm mt-1">{{ errors.name?.[0] }}</p>
      </div>
      <div>
        <label for="contact-email" class="block text-xs font-bold uppercase mb-2">Email</label>
        <input id="contact-email" v-model="form.email" class="contact-input" type="email" required maxlength="254" autocomplete="email" placeholder="you@example.com" :aria-invalid="!!errors.email" aria-describedby="email-error">
        <p id="email-error" class="text-sm mt-1">{{ errors.email?.[0] }}</p>
      </div>
    </div>
    <label for="contact-message" class="block text-xs font-bold uppercase mt-5 mb-2">Message</label>
    <textarea id="contact-message" v-model="form.message" class="contact-input" rows="4" required minlength="10" maxlength="5000" placeholder="Tell me about your next mission..." :aria-invalid="!!errors.message" aria-describedby="message-error"></textarea>
    <p id="message-error" class="text-sm mt-1">{{ errors.message?.[0] }}</p>
    <div class="hidden" aria-hidden="true"><label for="contact-website">Website</label><input id="contact-website" v-model="form.website" tabindex="-1" autocomplete="off"></div>
    <button class="mt-5 bg-black text-white font-bold uppercase tracking-widest px-8 py-4 hover-trigger disabled:opacity-60" type="submit" :disabled="busy">{{ busy ? 'TRANSMITTING...' : 'SEND TRANSMISSION' }} <i class="fas fa-arrow-right ml-3" aria-hidden="true"></i></button>
    <p class="font-mono text-sm mt-4" role="status" aria-live="polite" :data-success="succeeded">{{ status }}</p>
  </form>
</template>
