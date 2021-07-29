import { VNode } from 'vue'
import mixins, { ExtractVue } from '../../../util/mixins'

import Themeable from '../../../mixins/themeable'
import VChip from '../../VChip'
import Decoratable from '../../../mixins/decoratable'

const baseMixins = mixins(
  Themeable,
  Decoratable,
  /* @vue/component */
)
interface options extends ExtractVue<typeof baseMixins> {
  $el: HTMLElement
}

export default baseMixins.extend<options>().extend({
  name: 'v-column-crud-object',

  inheritAttrs: false,

  props: {
    showId: Boolean,
  },

  methods: {
    genObjecChip (): VNode {
      return this.$createElement(
        VChip,
        {
          props: {
            label: true,
            light: this.light,
            dark: this.dark,
          },
        },
        [
          this.showId ? this.$createElement(
            VChip,
            {
              staticClass: 'me-1 px-1',
              props: {
                xSmall: true,
                light: !this.light,
                dark: !this.dark,
              },
            },
            '#' + this.value.id,
          ) : '',
          this.getLabelString(),
        ]
      )
    },
    genRoot (): VNode {
      return this.$createElement(
        'div',
        {
          staticClass: 'd-flex flex-column justify-center align-center',
        },
        [
          this.genObjecChip(),
        ]
      )
    },
  },

  render (h): VNode {
    return this.genRoot()
  },
})
