import { VMenu } from '../VMenu'
import { VTextField } from '../VTextField'
import { VColorPicker } from '../VColorPicker'
import { VIcon } from '../VIcon'
import { VNode } from 'vue/types/umd'

export default VTextField.extend({
  name: 'v-color-input',

  inheritAttrs: false,

  props: {
    showSwatches: Boolean,
    swatches: Array,
    hideModeSwitch: Boolean,
    dotSize: [Number, String],
    canvasHeight: [Number, String],
    mode: String,
  },

  data () {
    return {
      pickedColor: this.value,
      menu: false,
      pickerIcon: this.prependInnerIcon || 'mdi-format-color-fill',
    }
  },

  methods: {
    genPrependInnerSlot () {
      return this.genSlot('prepend', 'inner', [
        this.$createElement(
          VIcon,
          {
            props: {
              color: this.internalValue || this.validationState || 'black',
            },
          },
          'mdi-record'
        ),
        this.genIcon('picker', () => {
          this.menu = !this.menu
        }),
      ])
    },
  },

  render (h): VNode {
    return h(
      VMenu,
      {
        props: {
          value: this.menu,
          offsetY: true,
          closeOnContentClick: false,
          dark: this.dark,
          light: this.light,
          maxWidth: '300px',
        },
        on: {
          input: (e: any) => {
            this.menu = e
          },
        },
        scopedSlots: {
          activator: () => {
            const csuper = this.constructor as any
            return csuper.superOptions.render.call(this, h)
          },
        },
      },
      [
        h(
          VColorPicker,
          {
            props: {
              flat: this.flat,
              swatches: this.swatches,
              hideModeSwitch: this.hideModeSwitch,
              showSwatches: this.showSwatches,
              dark: this.dark,
              light: this.light,
              dotSize: this.dotSize,
              canvasHeight: this.canvasHeight,
              mode: this.mode,
            },
            on: {
              input: (e: any) => {
                this.internalValue = e.hexa
              },
            },
          }
        ),
      ]
    )
  },

})
