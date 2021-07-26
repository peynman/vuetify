import { PropType, VNode } from 'vue'
import mixins, { ExtractVue } from '../../../util/mixins'

import Sizeable from '../../../mixins/sizeable'
import Themeable from '../../../mixins/themeable'
import { VChip } from '../../VChip'

import { makeIsoDateTimeString } from '../util/createNativeLocalFormatter'

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
  name: 'v-column-timestamp',

  inheritAttrs: false,

  props: {
    dense: Boolean,
    showDate: {
      type: Boolean,
      default: true,
    },
    showTime: {
      type: Boolean,
      default: true,
    },
    dateOptions: {
      type: Object as PropType<Intl.DateTimeFormatOptions>,
      default: () => ({}),
    },
    timeOptions: {
      type: Object as PropType<Intl.DateTimeFormatOptions>,
      default: () => ({}),
    },
    timeChipProps: {
      type: Object,
      default: () => ({}),
    },
    dateChipProps: {
      type: Object,
      default: () => ({}),
    },
    locale: String,
    timezone: String,
    value: String,
  },

  computed: {
    sanitizedDate (): Date|undefined {
      const iso = makeIsoDateTimeString(this.value)
      if (iso) {
        return new Date(iso)
      }

      return undefined
    },
    localeFormatterDate (): Intl.DateTimeFormat|undefined {
      return new Intl.DateTimeFormat(this.locale || undefined, this.dateOptions)
    },
    localeFormatterTime (): Intl.DateTimeFormat|undefined {
      return new Intl.DateTimeFormat(this.locale || undefined, this.timeOptions)
    },
  },

  methods: {
    genChips (): VNode {
      const visibleParts = []

      if (this.showDate && this.sanitizedDate) {
        visibleParts.push(
          this.$createElement(
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
                ...this.dateChipProps,
              },
            },
            this.localeFormatterDate?.format(this.sanitizedDate)
          )
        )
      }
      if (this.showTime && this.sanitizedDate) {
        visibleParts.push(
          this.$createElement(
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
                ...this.timeChipProps,
              },
            },
            this.localeFormatterTime?.format(this.sanitizedDate)
          ),
        )
      }

      return this.$createElement(
        'div',
        {
          staticClass: 'd-flex flex-column justify-start',
        },
        visibleParts
      )
    },
  },

  render (h): VNode {
    return this.genChips()
  },
})
