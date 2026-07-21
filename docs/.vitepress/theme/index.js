import DefaultTheme from 'vitepress/theme'
import { nextTick } from 'vue'
import { useRoute } from 'vitepress'
import Mermaid from './Mermaid.vue'
import './custom.css'

// Trigger MathJax re-typeset after every route change (SPA navigation).
function setupMathJax() {
  if (typeof window === 'undefined') return
  const typeset = () => {
    if (window.MathJax && window.MathJax.typesetPromise) {
      window.MathJax.typesetPromise().catch(() => {})
    }
  }
  let scheduled = false
  const schedule = () => {
    if (scheduled) return
    scheduled = true
    requestAnimationFrame(() => {
      setTimeout(() => { typeset(); scheduled = false }, 50)
    })
  }
  // Initial typeset after MathJax loads
  const tryInitial = () => {
    if (window.MathJax && window.MathJax.typesetPromise) {
      typeset()
    } else {
      setTimeout(tryInitial, 100)
    }
  }
  tryInitial()
  // Observe DOM changes to catch route-swapped content
  const obs = new MutationObserver(() => schedule())
  obs.observe(document.body, { childList: true, subtree: true })
}

export default {
  extends: DefaultTheme,
  enhanceApp({ app, router }) {
    app.component('Mermaid', Mermaid)
    if (typeof window !== 'undefined') {
      app.mixin({
        mounted() {
          // Run once on first mount
          if (!window.__mathJaxSetup) {
            window.__mathJaxSetup = true
            setupMathJax()
          }
        },
      })
    }
  },
}
