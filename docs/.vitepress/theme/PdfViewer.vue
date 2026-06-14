<template>
  <div class="pdf-container">
    <VuePdfEmbed :source="src" />
  </div>
</template>

<script setup>
import VuePdfEmbed from 'vue-pdf-embed'

defineProps({
  src: { type: String, required: true },
})
</script>
