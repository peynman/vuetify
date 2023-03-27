// Extensions
import VCarousel from '../VCarousel/VCarousel'

// Components
import VBtn from '../VBtn'
import VIcon from '../VIcon'
import VProgressLinear from '../VProgressLinear'

// Mixins
// TODO: Move this into core components v2.0
import ButtonGroup from '../../mixins/button-group'

// Utilities
import { convertToUnit } from '../../util/helpers'
import { breaking } from '../../util/console'

// Types
import { VNode, PropType } from 'vue'

export default VCarousel.extend({
  name: 'v-cube-carousel',
  methods: {
    genItems (): VNode {
      const length = this.items.length
      const children = []

      for (let i = 0; i < length; i++) {
        const child = this.$createElement(VBtn, {
          staticClass: 'v-carousel__controls__item',
          attrs: {
            'aria-label': this.$vuetify.lang.t('$vuetify.carousel.ariaLabel.delimiter', i + 1, length),
          },
          props: {
            icon: true,
            small: true,
            value: this.getValue(this.items[i], i),
          },
        }, [
          this.$createElement(VIcon, {
            props: { size: 18 },
          }, this.delimiterIcon),
        ])

        children.push(child)
      }

      return this.$createElement(ButtonGroup, {
        props: {
          value: this.internalValue,
          mandatory: this.mandatory,
        },
        on: {
          change: (val: unknown) => {
            this.internalValue = val
          },
        },
      }, children)
    },
  },
})
