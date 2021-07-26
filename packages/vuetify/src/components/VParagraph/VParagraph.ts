import { VNode } from 'vue'

import mixins, { ExtractVue } from '../../util/mixins'
import Colorable from '../../mixins/colorable'

const baseMixins = mixins(
  Colorable
  /* @vue/component */
)
interface options extends ExtractVue<typeof baseMixins> {
  $el: HTMLElement
}

export default baseMixins.extend<options>().extend({
  name: 'v-paragraph',

  inheritAttrs: false,

  props: {
    content: String,
    tag: {
      type: String,
      default: 'span',
    },
  },

  methods: {
    genData () {
      return {}
    },
  },

  render (h): VNode {
    const data = this.genData()
    return h(this.tag, this.setTextColor(this.color, data), [this.content])
  },
})
