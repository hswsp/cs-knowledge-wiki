<template>
  <div class="pdf-container">
    <div v-if="loading" class="pdf-loading">加载 PDF 中...</div>
    <div v-if="error" class="pdf-error">{{ error }}</div>
    <div v-for="page in numPages" :key="page" class="pdf-page">
      <canvas :ref="el => setCanvasRef(el, page - 1)"></canvas>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, shallowRef } from 'vue'

const props = defineProps({
  src: { type: String, required: true },
})

const loading = ref(true)
const error = ref(null)
const numPages = ref(0)
const canvasRefs = shallowRef([])

function setCanvasRef(el, index) {
  if (el) {
    canvasRefs.value[index] = el
  }
}

onMounted(async () => {
  try {
    const pdfjsLib = await import('pdfjs-dist')
    pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'

    const loadingTask = pdfjsLib.getDocument(props.src)
    const pdf = await loadingTask.promise
    numPages.value = pdf.numPages

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i)
      const viewport = page.getViewport({ scale: 1.5 })
      const canvas = canvasRefs.value[i - 1]
      if (!canvas) continue
      const ctx = canvas.getContext('2d')
      canvas.width = viewport.width
      canvas.height = viewport.height
      await page.render({ canvasContext: ctx, viewport }).promise
    }

    loading.value = false
  } catch (e) {
    error.value = 'PDF 加载失败: ' + e.message
    loading.value = false
  }
})
</script>

<style scoped>
.pdf-container {
  max-width: 100%;
}
.pdf-loading,
.pdf-error {
  text-align: center;
  padding: 40px;
  color: var(--vp-c-text-2);
}
.pdf-error {
  color: var(--vp-c-danger-1);
}
.pdf-page {
  margin-bottom: 16px;
}
.pdf-page canvas {
  max-width: 100%;
  height: auto !important;
  display: block;
  margin: 0 auto;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}
</style>
