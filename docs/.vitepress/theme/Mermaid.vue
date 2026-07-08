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
  display: flex;
  justify-content: center;
  margin: 1em 0;
  overflow-x: auto;
}
</style>
