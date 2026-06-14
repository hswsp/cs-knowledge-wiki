<template>
  <div class="pdf-container">
    <component v-if="PdfComponent" :is="PdfComponent" :source="src" />
    <div v-else class="pdf-loading">加载 PDF 中...</div>
  </div>
</template>

<script setup>
import { ref, onMounted, shallowRef } from 'vue'

defineProps({
  src: { type: String, required: true },
})

const PdfComponent = shallowRef(null)

onMounted(async () => {
  const mod = await import('vue-pdf-embed')
  PdfComponent.value = mod.default || mod
})
</script>

<style scoped>
.pdf-loading {
  text-align: center;
  padding: 40px;
  color: var(--vp-c-text-2);
}
</style>
