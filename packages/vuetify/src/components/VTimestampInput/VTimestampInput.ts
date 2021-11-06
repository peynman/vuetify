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
import { DatePickerFormatter } from 'types'

const baseMixins = mixins(
  Localable,
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
    range: Boolean,
    max: String,
    min: String,
    landscape: Boolean,
    firstDayOfWeek: {
      type: [String, Number],
      default: 0,
    },
    localeFirstDayOfYear: {
      type: [String, Number],
      default: 0,
    },
    headerDateFormat: Function as PropType<DatePickerFormatter | undefined>,
    monthFormat: Function as PropType<DatePickerFormatter | undefined>,
    scrollable: Boolean,
    headerColor: String,
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
      type: [String, Array, Date, undefined] as PropType<string|string[]|Date|Date[]>,
    },
  },

  data () {
    return {
      fromDate: undefined as Date | undefined,
      toDate: undefined as Date | undefined,
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
        if (this.fromDate && this.toDate) {
          return [this.fromDate, this.toDate]
        } else if (this.fromDate) {
          return [this.fromDate]
        }
      } else if (this.fromDate) {
        return this.fromDate
      }

      return null
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
    fromDateString (): String {
      return (this.fromDate ?? new Date()).toISOString().split('T')[0]
    },
    toDateString (): String {
      return (this.toDate ?? new Date()).toISOString().split('T')[0]
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
        } else {
          this.lazyValue = null
        }
        this.$emit('input', val)
      },
    },
  },

  watch: {
    value: {
      deep: true,
      handler () {
        this.updateFromToDate(this.value)
      },
    },
  },

  mounted () {
    this.updateFromToDate(this.value)
  },

  methods: {
    updateFromDateRange (value: string[]|Date[]) {
      if (value[0] instanceof Date) {
        this.fromDate = value[0]
      } else {
        const isoFrom = makeIsoDateTimeString(value[0])
        if (isoFrom) {
          this.fromDate = new Date(isoFrom)
        } else {
          this.fromDate = undefined
        }
      }
      if (value[1] instanceof Date) {
        this.toDate = value[1]
      } else {
        const isoTo = makeIsoDateTimeString(value[1])
        if (isoTo) {
          this.toDate = new Date(isoTo)
        } else {
          this.toDate = undefined
        }
      }
    },
    updateFromToDate (value: string|Date|Date[]|string[]) {
      if (value) {
        if (Array.isArray(value)) {
          this.updateFromDateRange(value)
        } else {
          if (value instanceof Date) {
            this.fromDate = this.value
          } else {
            const iso = makeIsoDateTimeString(value)
            if (iso) {
              this.fromDate = new Date(iso)
            }
          }
          this.toDate = undefined
        }
      } else {
        this.fromDate = undefined
        this.toDate = undefined
      }

      if (this.fromDate && this.toDate && this.fromDate.getTime() > this.toDate.getTime()) {
        const temp = this.fromDate
        this.fromDate = this.toDate
        this.toDate = temp
      }

      this.internalValue = this.timestamp
    },
    isDateStringValid (date: string): Boolean {
      const d = new Date(date)
      const s = d.toString()
      return s !== 'Invalid Date'
    },
    genTimePickerSimple (): VNode {
      const extras = []

      if (this.pickTime) {
        const currTimeRef: Date|undefined = this.timeIndex === 0 ? this.fromDate : this.toDate

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
                        const newDate = new Date((this.fromDate ?? new Date()).getTime())
                        newDate.setHours(e.valueOf())
                        this.fromDate = newDate
                      } else {
                        const newDate = new Date((this.toDate ?? new Date()).getTime())
                        newDate.setHours(e.valueOf())
                        this.toDate = newDate
                      }
                      this.internalValue = this.timestamp
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
                        const newDate = new Date((this.fromDate ?? new Date()).getTime())
                        newDate.setMinutes(e.valueOf())
                        this.fromDate = newDate
                      } else {
                        const newDate = new Date((this.toDate ?? new Date()).getTime())
                        newDate.setMinutes(e.valueOf())
                        this.toDate = newDate
                      }
                      this.internalValue = this.timestamp
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
      const rangeValue = [this.fromDateString]
      if (this.toDate) {
        rangeValue.push(this.toDateString)
      }
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
            value: this.range ? rangeValue : this.fromDateString,
          },
          on: {
            input: (ev: any) => {
              if (Array.isArray(ev)) {
                if (this.toDate) {
                  const newDateFrom = new Date(Date.parse(ev[0]))
                  if (this.fromDate && newDateFrom) {
                    newDateFrom.setHours(this.fromDate.getHours())
                    newDateFrom.setMinutes(this.fromDate.getMinutes())
                  }
                  this.fromDate = newDateFrom
                  this.toDate = undefined
                } else {
                  const newDateFrom = new Date(Date.parse(ev[0]))
                  if (this.fromDate) {
                    newDateFrom.setHours(this.fromDate.getHours())
                    newDateFrom.setMinutes(this.fromDate.getMinutes())
                  }
                  this.fromDate = newDateFrom
                  const newDateTo = new Date(Date.parse(ev[1]))
                  this.toDate = newDateTo
                }
              } else {
                const newDateFrom = new Date(Date.parse(ev))
                if (this.fromDate) {
                  newDateFrom.setHours(this.fromDate.getHours())
                  newDateFrom.setMinutes(this.fromDate.getMinutes())
                }
                this.fromDate = newDateFrom
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
