import { h } from 'vue'
import VuePdfEmbed from 'vue-pdf-embed'

export default {
  props: {
    src: { type: String, required: true },
  },
  setup(props) {
    return () => h('div', { class: 'pdf-container' }, [
      h(VuePdfEmbed, { source: props.src }),
    ])
  },
}
