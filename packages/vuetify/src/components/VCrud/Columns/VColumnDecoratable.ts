import { PropType, VNode } from 'vue'
import mixins, { ExtractVue } from '../../../util/mixins'

import Sizeable from '../../../mixins/sizeable'
import Themeable from '../../../mixins/themeable'
import Decoratable from '../util/decoratable'

const baseMixins = mixins(
  Decoratable,
  Sizeable,
  Themeable,
  /* @vue/component */
)
interface options extends ExtractVue<typeof baseMixins> {
  $el: HTMLElement
}

export default baseMixins.extend<options>().extend({
  name: 'v-column-decoratable',

  inheritAttrs: false,

  props: {
    dense: Boolean,
    wrap: String,
    wrapClass: String,
    wrapAttributes: {
      type: Object as PropType<{ [key: string]: any }>,
      default: () => ({}),
    },
    wrapProps: {
      type: Object as PropType<{ [key: string]: string }>,
      default: () => ({}),
    },
  },

  methods: {
    genLabel (): VNode {
      return this.$createElement(
        this.wrap ?? 'div',
        {
          staticClass: this.wrapClass ?? '',
          props: this.wrapProps,
          ...(this.wrapAttributes ?? {}),
        },
        this.getLabelString()
      )
    },
  },

  render (h): VNode {
    return this.genLabel()
  },
})
