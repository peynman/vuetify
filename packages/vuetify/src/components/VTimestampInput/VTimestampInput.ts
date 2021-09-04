import { PropType, VNode } from 'vue'
import mixins, { ExtractVue } from '../../util/mixins'

import { VMenu } from '../VMenu'
import { VTextField } from '../VTextField'
import { VDatePicker } from '../VDatePicker'
import { VRow, VCol } from '../VGrid'
import { VBtn } from '../VBtn'
import { VAutocomplete } from '../VAutocomplete'
import { VBtnToggle } from '../VBtnToggle'
import Localable from '../../mixins/localable'
import { makeIsoDateTimeString } from '../VCrud/util/createNativeLocalFormatter'

const baseMixins = mixins(
  Localable,
  VDatePicker,
  VTextField,
  /* @vue/component */
)
interface options extends ExtractVue<typeof baseMixins> {
  $el: HTMLElement
}

export default baseMixins.extend<options>().extend({
  name: 'v-timestamp-input',

  inheritAttrs: false,

  props: {
    displayOptions: {
      type: Object as PropType<Intl.DateTimeFormatOptions> | undefined,
      default: undefined,
    },
    pickTime: {
      type: Boolean,
      default: true,
    },
    readonly: Boolean,
    value: {
      type: null as any as PropType<string|string[]|Date|Date[]>,
    },
  },

  data () {
    let fromDate = null
    let toDate = null
    if (this.value) {
      if (Array.isArray(this.value)) {
        if (this.value[0] instanceof Date) {
          fromDate = this.value[0]
          toDate = this.value[1]
        } else {
          const isoFrom = makeIsoDateTimeString(this.value[0])
          const isoTo = makeIsoDateTimeString(this.value[1])
          if (isoFrom) {
            fromDate = new Date(isoFrom)
          }
          if (isoTo) {
            toDate = new Date(isoTo)
          }
        }
      } else {
        if (this.value instanceof Date) {
          fromDate = this.value
        } else {
          const iso = makeIsoDateTimeString(this.value)
          if (iso) {
            fromDate = new Date(iso)
          }
        }
      }
    }

    return {
      fromDate,
      toDate,
      isOpened: false,
      timeIndex: 0,
      pickerIcon: this.prependInnerIcon || 'mdi-calendar',
    }
  },

  computed: {
    displayFormatOptions (): Object {
      return this.displayOptions ?? {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        ...(this.pickTime ? {
          hour: 'numeric',
          minute: 'numeric',
        } : {}),
      }
    },
    dateFormatter (): Intl.DateTimeFormat {
      return new Intl.DateTimeFormat(this.currentLocale, this.displayFormatOptions)
    },
    numberFormatter (): Intl.NumberFormat {
      return new Intl.NumberFormat(this.currentLocale, { style: 'decimal', minimumIntegerDigits: 2 })
    },
    displayString (): String {
      if (!this.fromDate) {
        return ''
      }

      if (this.range) {
        return this.$vuetify.lang.t('$vuetify.datePickerInput.input',
          this.dateFormatter.format(this.fromDate),
          this.dateFormatter.format(this.toDate),
        )
      } else {
        return this.dateFormatter.format(this.fromDate)
      }
    },
    timestamp (): Date|Date[]|null {
      if (this.range) {
        return [this.fromDate, this.toDate]
      } else {
        return this.fromDate
      }
    },
    hours (): Array<any> {
      const hours = []
      for (let i = 0; i <= 23; i++) {
        hours.push({
          value: i,
          text: this.numberFormatter.format(i).toString(),
        })
      }
      return hours
    },
    minutes (): Array<any> {
      const minutes = []
      for (let i = 0; i <= 59; i++) {
        minutes.push({
          value: i,
          text: this.numberFormatter.format(i).toString(),
        })
      }
      return minutes
    },
    internalValue: {
      get (): any {
        return this.lazyValue
      },
      set (val: any) {
        this.lazyValue = val
        this.$emit('input', this.displayString)
      },
    },
  },

  methods: {
    isDateStringValid (date: string): Boolean {
      const d = new Date(date)
      const s = d.toString()
      return s !== 'Invalid Date'
    },
    genTimePickerSimple (): VNode {
      const extras = []

      if (this.pickTime) {
        const currTimeRef: Date|null = this.timeIndex === 0 ? this.fromDate : this.toDate

        if (this.range) {
          extras.push(
            this.$createElement(
              VCol,
              {
                staticClass: 'd-flex flex-row align-center justify-center',
                props: {
                  cols: 12,
                  sm: 3,
                },
              },
              [
                this.$createElement(
                  VBtnToggle,
                  {
                    props: {
                      value: this.timeIndex,
                      mandatory: true,
                    },
                    on: {
                      change: (e: any) => {
                        this.timeIndex = e
                      },
                    },
                  },
                  [
                    this.$createElement(
                      VBtn,
                      {
                        props: {
                          dense: true,
                          small: true,
                        },
                      },
                      this.$vuetify.lang.t('$vuetify.datePickerInput.startTime')
                    ),
                    this.$createElement(
                      VBtn,
                      {
                        props: {
                          dense: true,
                          small: true,
                        },
                      },
                      this.$vuetify.lang.t('$vuetify.datePickerInput.endTime')
                    ),
                  ]
                ),
              ]
            )
          )
        }

        extras.push(
          this.$createElement(
            VCol,
            {
              staticClass: 'd-flex flex-row align-center justify-center',
              props: {
                cols: 12,
                sm: this.range ? 7 : 10,
              },
            },
            [
              this.$createElement(
                VAutocomplete,
                {
                  props: {
                    items: this.hours,
                    dense: true,
                    solo: true,
                    hideDetails: true,
                    mandatory: true,
                    value: currTimeRef?.getHours(),
                  },
                  on: {
                    input: (e: Number) => {
                      if (this.timeIndex === 0) {
                        if (!this.fromDate) {
                          this.fromDate = new Date()
                        }
                        this.fromDate.setHours(e.valueOf())
                      } else {
                        if (!this.toDate) {
                          this.toDate = new Date()
                        }
                        this.toDate.setHours(e.valueOf())
                      }
                    },
                  },
                },
              ),
              this.$createElement(
                'strong',
                {
                  staticClass: 'px-2',
                },
                ':'
              ),
              this.$createElement(
                VAutocomplete,
                {
                  props: {
                    items: this.minutes,
                    dense: true,
                    solo: true,
                    hideDetails: true,
                    mandatory: true,
                    value: currTimeRef?.getMinutes(),
                  },
                  on: {
                    input: (e: Number) => {
                      if (this.timeIndex === 0) {
                        if (!this.fromDate) {
                          this.fromDate = new Date()
                        }
                        this.fromDate.setMinutes(e.valueOf())
                      } else {
                        if (!this.toDate) {
                          this.toDate = new Date()
                        }
                        this.toDate.setMinutes(e.valueOf())
                      }
                    },
                  },
                },
              ),
            ]
          )
        )
      }
      return this.$createElement(
        VRow,
        {
          props: {
            align: 'center',
            justify: 'center',
          },
        },
        [
          ...extras,
          this.$createElement(
            VCol,
            {
              staticClass: 'd-flex flex-row justify-center align-center',
              props: {
                cols: 12,
                sm: 2,
              },
            },
            [
              this.$createElement(
                VBtn,
                {
                  props: {
                    color: 'primary',
                  },
                  on: {
                    click: () => {
                      this.isOpened = false
                      this.internalValue = this.timestamp
                    },
                  },
                },
                this.$vuetify.lang.t('$vuetify.datePickerInput.ok')
              ),
            ]
          ),
        ]
      )
    },
    genDatePickerDialogItem (): VNode {
      return this.$createElement(
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
            scrollable: this.scrollable,
            fullWidth: true,
            color: this.color,
            headerColor: this.headerColor,
            value: this.fromDate,
          },
          on: {
            input: (ev: any) => {
              if (Array.isArray(ev)) {
                if (!this.fromDate) {
                  this.fromDate = new Date()
                }
                if (!this.toDate) {
                  this.toDate = new Date()
                }
                const nvFrom = new Date(Date.parse(ev[0]))
                const nvTo = new Date(Date.parse(ev[1]))

                this.fromDate.setDate(nvFrom.getDate())
                this.toDate.setDate(nvTo.getDate())
              } else {
                if (!this.fromDate) {
                  this.fromDate = new Date()
                }
                const nvFrom = new Date(Date.parse(ev))
                this.fromDate.setDate(nvFrom.getDate())
              }
              this.internalValue = this.timestamp
            },
          },
        },
        [
          this.genTimePickerSimple(),
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
        this.genDatePickerDialogItem(),
      ]
    )
  },
})
