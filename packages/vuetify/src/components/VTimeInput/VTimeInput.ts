import { PropType, VNode } from 'vue'
import mixins, { ExtractVue } from '../../util/mixins'

import VMenu from '../VMenu/VMenu'
import VTextField from '../VTextField/VTextField'
import VTimePicker from '../VTimePicker/VTimePicker'
import Localable from '../../mixins/localable'

const baseMixins = mixins(
  Localable,
  VTextField,
  /* @vue/component */
)
interface options extends ExtractVue<typeof baseMixins> {
  $el: HTMLElement
}

export default baseMixins.extend<options>().extend({
  name: 'v-time-input',

  inheritAttrs: false,

  props: {
    max: String,
    min: String,
    headerColor: String,
    landscape: Boolean,
    scrollable: Boolean,
    ampm: Boolean,
    ampmInTitle: Boolean,
    pickDuration: Boolean,
    returnMinutes: Boolean,
    displayOptions: {
      type: Object as PropType<Intl.DateTimeFormatOptions> | undefined,
      default: undefined,
    },
    readonly: Boolean,
    value: {
      type: [String, Number, Date, undefined] as PropType<string|Date|number>,
    },
  },

  data () {
    return {
      timeValue: undefined as Date | undefined,
      minuteValue: undefined as Number | undefined,
      isOpened: false,
      pickerIcon: this.prependInnerIcon || 'mdi-timer-sand-full',
    }
  },

  computed: {
    displayFormatOptions (): Object {
      return this.displayOptions ?? {
        hour: 'numeric',
        minute: 'numeric',
      }
    },
    dateFormatter (): Intl.DateTimeFormat {
      return new Intl.DateTimeFormat(this.currentLocale, this.displayFormatOptions)
    },
    numberFormatter (): Intl.NumberFormat {
      return new Intl.NumberFormat(this.currentLocale, { style: 'decimal', minimumIntegerDigits: 2 })
    },
    timeString (): String {
      return (this.timeValue?.getHours() ?? '00') + ':' + (this.timeValue?.getMinutes() ?? '00')
    },
    displayString (): String {
      if (!this.timeValue) {
        return ''
      }

      if (this.pickDuration) {
        return this.$vuetify.lang.t('$vuetify.timePickerInput.duration',
          this.numberFormatter.format(this.timeValue.getHours()),
          this.numberFormatter.format(this.timeValue.getMinutes()),
        )
      }
      return this.dateFormatter.format(this.timeValue)
    },
    isReadonly () {
      return true
    },
    internalValue: {
      get (): any {
        return this.lazyValue
      },
      set (val: any) {
        if (val) {
          this.lazyValue = this.displayString
          if (this.returnMinutes) {
            this.$emit('input', this.minuteValue)
            return
          }
        } else {
          this.lazyValue = null
        }

        this.$emit('input', val)
      },
    },
  },

  watch: {
    value () {
      this.updateFromToDate(this.value)
    },
  },

  mounted () {
    this.updateFromToDate(this.value)
  },

  methods: {
    updateFromToDate (value: string|Date|number) {
      if (value) {
        if (value instanceof Date) {
          this.timeValue = value
        } else {
          if (!this.timeValue) {
            this.timeValue = new Date()
          }
          if (typeof value === 'string' && value.includes(':')) {
            const parts = value.split(':')
            const hh = parseInt(parts[0])
            const mm = parseInt(parts[1])
            this.timeValue.setHours(hh)
            this.timeValue.setMinutes(mm)
          } else if (typeof value === 'number' || !isNaN(parseInt(value))) {
            const d = parseInt(value)
            const h = Math.floor(d / 60)
            const m = d - h * 60
            this.timeValue.setHours(h)
            this.timeValue.setMinutes(m)
          }
        }
      }

      this.minuteValue = (this.timeValue?.getHours() ?? 0) * 60 + (this.timeValue?.getMinutes() ?? 0)
      this.internalValue = this.timeValue
    },
    genPickerDialogItem (): VNode {
      return this.$createElement(
        VTimePicker,
        {
          props: {
            locale: this.locale,
            min: this.min,
            max: this.max,
            landscape: this.landscape,
            fullWidth: true,
            color: this.color,
            headerColor: this.headerColor,
            scrollable: this.scrollable,
            format: this.ampm ? undefined : '24hr',
            ampmInTitle: this.ampmInTitle,
            value: this.timeString,
          },
          on: {
            input: (ev: any) => {
              this.updateFromToDate(ev)
            },
          },
        },
        [
        ]
      )
    },
    genPrependInnerSlot () {
      return this.genSlot('prepend', 'inner', [
        this.genIcon('picker', () => {
          this.isOpened = !this.isOpened
        }),
      ])
    },
  },

  render (h): VNode {
    return h(
      VMenu,
      {
        props: {
          offsetY: true,
          closeOnContentClick: false,
          value: this.isOpened,
        },
        on: {
          input: (e: any) => {
            this.isOpened = e
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
        this.genPickerDialogItem(),
      ]
    )
  },
})
