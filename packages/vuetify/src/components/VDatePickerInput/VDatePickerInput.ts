import Vue, { PropType, VNode } from 'vue'

import { VMenu } from '../VMenu'
import { VTextField } from '../VTextField'
import { VDatePicker } from '../VDatePicker'

export default Vue.extend({
  name: 'v-date-picker-input',

  inheritAttrs: false,

  props: {
    appendOuterIcon: String,
    clearable: Boolean,
    disabled: Boolean,
    filled: Boolean,
    flat: Boolean,
    fullWidth: Boolean,
    label: String,
    outlined: Boolean,
    placeholder: String,
    prefix: String,
    prependInnerIcon: String,
    persistentPlaceholder: Boolean,
    reverse: Boolean,
    rounded: Boolean,
    shaped: Boolean,
    solo: Boolean,
    soloInverted: Boolean,
    suffix: String,
    time: Boolean,
    dense: Boolean,
    // picker
    landscape: Boolean,
    max: String,
    min: String,
    locale: String,
    localeFirstDayOfYear: {
      type: [String, Number],
      default: 0,
    },
    firstDayOfWeek: {
      type: [String, Number],
      default: 0,
    },
    range: Boolean,
    readonly: Boolean,
    scrollable: Boolean,
    value: [Array, String] as PropType<string | string[] | undefined>,
  },

  data () {
    let datesValue = this.value
    if (!Array.isArray(datesValue) && typeof datesValue === 'string') {
      datesValue = datesValue.split('~')
    }

    return {
      datesValue,
    }
  },

  methods: {
    genInputDialog (): VNode {
      return this.$createElement(
        VMenu,
        {
          props: {
            offsetY: true,
            closeOnContentClick: false,
          },
          on: {
          },
          scopedSlots: {
            activator: (activator: any) => this.$createElement(
              VTextField,
              {
                props: {
                  dense: this.dense,
                  solo: this.solo,
                  soloInverted: this.soloInverted,
                  persistentPlaceholder: this.persistentPlaceholder,
                  suffix: this.suffix,
                  prefix: this.prefix,
                  outlined: this.outlined,
                  appendOuterIcon: this.appendOuterIcon,
                  prependInnerIcon: 'mdi-calendar',
                  clearable: this.clearable,
                  readonly: this.readonly,
                  disabled: this.disabled,
                  shaped: this.shaped,
                  rounded: this.rounded,
                  filled: this.filled,
                  flat: this.flat,
                  fullWidth: this.fullWidth,
                  ...activator.attrs,
                  value: this.datesValue?.join('~'),
                },
                on: {
                  focus: (ev: any) => {
                    activator.on.click(ev)
                  },
                  'click:prepend-inner': (ev: any) => {
                    activator.on.click(ev)
                  },
                  change: (ev: string|null) => {
                    if (ev) {
                      if (ev.includes('~')) {
                        this.datesValue = ev.split('~')
                      } else {
                        this.datesValue = [ev]
                      }
                    }
                  },
                },
              },
            ),
          },
        },
        [
          this.$createElement(
            VDatePicker,
            {
              props: {
                locale: this.locale,
                range: this.range,
                min: this.min,
                max: this.max,
                landscape: this.landscape,
                firstDayOfWeek: this.firstDayOfWeek,
                localeFirstDayOfYear: this.localeFirstDayOfYear,
                fullWidth: true,
                value: this.datesValue,
              },
              on: {
                input: (ev: any) => {
                  if (Array.isArray(ev)) {
                    this.datesValue = ev
                  } else {
                    this.datesValue = [ev]
                  }
                  this.$emit('change', this.datesValue)
                },
              },
            },
          ),
        ]
      )
    },
  },

  render (h): VNode {
    return this.genInputDialog()
  },
})
