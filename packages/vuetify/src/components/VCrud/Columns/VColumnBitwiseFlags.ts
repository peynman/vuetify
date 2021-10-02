import { PropType, VNode } from 'vue'
import mixins, { ExtractVue } from '../../../util/mixins'

import Sizeable from '../../../mixins/sizeable'
import Themeable from '../../../mixins/themeable'
import { VChip } from '../../VChip'

export type BitwiseType = {
  value: number
  title?: string
  color?: string
}

const baseMixins = mixins(
  Sizeable,
  Themeable,
  /* @vue/component */
)
interface options extends ExtractVue<typeof baseMixins> {
  $el: HTMLElement
}

export default baseMixins.extend<options>().extend({
  name: 'v-column-bitwise-flags',

  inheritAttrs: false,

  props: {
    dense: Boolean,
    flags: {
      type: Array as PropType<BitwiseType[]>,
      default: () => ([]),
    },
    value: Number,
  },

  computed: {
    bitwiseMap (): BitwiseType[] {
      const map = [] as BitwiseType[]
      this.flags.forEach((dic: BitwiseType) => {
        if ((this.value & dic.value) !== 0) {
          map.push(dic)
        }
      })
      return map
    },
  },

  methods: {
    genChips (): VNode {
      return this.$createElement(
        'div',
        {
          staticClass: 'd-flex flex-column justify-start align-center',
        },
        this.bitwiseMap.map<VNode>((bit: BitwiseType) => {
          return this.$createElement(
            VChip,
            {
              props: {
                dark: this.dark,
                light: this.light,
                small: this.small,
                xSmall: this.xSmall,
                large: this.large,
                xLarge: this.xLarge,
                dense: this.dense,
                color: bit.color,
              },
            },
            bit.title
          )
        })
      )
    },
  },

  render (h): VNode {
    return this.genChips()
  },
})
