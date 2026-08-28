import DefaultTheme from 'vitepress/theme'
import { nextTick } from 'vue'
import { useRoute } from 'vitepress'
import Mermaid from './Mermaid.vue'
import './custom.css'

// Trigger MathJax re-typeset after the initial load and on SPA route changes.
//
// IMPORTANT: do NOT observe the DOM with a MutationObserver here. MathJax's
// typeset pass inserts its own measurement probes (<mjx-test>/<mjx-container>)
// into the document; observing body mutations re-triggers typeset, which
// re-inserts probes, and the two feed each other in an endless loop that grows
// the DOM until the renderer runs out of memory and Chrome shows "Aw, Snap!".
// Route changes are the only re-typeset trigger needed.
function setupMathJax() {
  if (typeof window === 'undefined') return
  const typeset = () => {
    if (window.MathJax && window.MathJax.typesetPromise) {
      window.MathJax.typesetPromise().catch(() => {})
    }
  }
  // Initial typeset after MathJax (async script) finishes loading.
  const tryInitial = () => {
    if (window.MathJax && window.MathJax.typesetPromise) {
      typeset()
    } else {
      setTimeout(tryInitial, 100)
    }
  }
  tryInitial()
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
      // Re-typeset new page content after SPA navigation.
      router.onAfterRouteChange = () => {
        if (window.MathJax && window.MathJax.typesetPromise) {
          window.MathJax.typesetPromise().catch(() => {})
        }
      }
    }
  },
}
