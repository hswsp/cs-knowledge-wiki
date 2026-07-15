<template>
  <div class="mermaid-wrapper" ref="container"></div>
</template>

<script setup>
import { ref, onMounted, defineProps } from 'vue'

const props = defineProps({ code: String })
const container = ref(null)

onMounted(async () => {
  const { default: mermaid } = await import('mermaid')
  mermaid.initialize({ startOnLoad: false, securityLevel: 'loose' })

  const source = decodeURIComponent(props.code)
  try {
    const { svg } = await mermaid.render('mermaid-' + Math.random().toString(36).slice(2), source)
    if (container.value) {
      container.value.innerHTML = svg
      requestAnimationFrame(() => {
        const svgEl = container.value?.querySelector('svg')
        if (!svgEl) return
        const g = svgEl.querySelector('g')
        if (!g) return
        try {
          const bbox = g.getBBox()
          const padding = 10
          const w = bbox.x + bbox.width + padding
          const h = bbox.y + bbox.height + padding
          svgEl.setAttribute('viewBox', `0 0 ${w} ${h}`)
        } catch {}
      })
    }
  } catch (e) {
    if (container.value) {
      container.value.innerHTML = `<pre style="color:red">Mermaid render error: ${e.message}</pre>`
    }
  }
})
</script>

<style>
.mermaid-wrapper {
  margin: 1em 0;
  overflow-x: auto;
}
.mermaid-wrapper svg {
  display: block;
  max-width: 100%;
  height: auto;
  margin: 0 auto;
  overflow: visible;
}
</style>
