import Vue, { PropType, VNode } from 'vue'

import { VMenu } from '../VMenu'
import { VTextField } from '../VTextField'
import { VDatePicker } from '../VDatePicker'
import { VRow, VCol } from '../VGrid'
import { VTimePicker } from '../VTimePicker'
import { VCard, VCardText, VCardActions } from '../VCard'
import { VBtn } from '../VBtn'
import { VBtnToggle } from '../VBtnToggle'

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
    displayOptions: {
      type: Object as PropType<Intl.DateTimeFormatOptions> | undefined,
      default: undefined,
    },
    pickTime: {
      type: Boolean,
      default: true,
    },
    pickDate: {
      type: Boolean,
      default: true,
    },
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
    color: String,
    timeFormat: {
      type: String,
      default: 'ampm',
    },
    timeHeaderColor: String,
    dateHeaderColor: String,
    value: [Array, String] as PropType<string | string[] | undefined>,
  },

  data () {
    let datesValue: string|string[]|undefined = this.value
    if (!Array.isArray(datesValue) && typeof datesValue === 'string' && this.range) {
      datesValue = datesValue.split('~')
    }

    // eslint-disable-next-line no-undef-init
    let timeStartValue: string|string[]|undefined = undefined
    // eslint-disable-next-line no-undef-init
    let timeEndValue: string|string[]|undefined = undefined
    if (datesValue) {
      if (Array.isArray(datesValue)) {
        timeStartValue = datesValue?.[0].split('T')[1]
        timeEndValue = datesValue?.[1].split('T')[1]
      } else {
        timeStartValue = datesValue.split('T')[1]
      }
    }

    let dOptions = this.displayOptions
    if (!dOptions) {
      if (!this.pickDate) {
        dOptions = {
          hour: 'numeric',
          minute: 'numeric',
        }
      } else if (!this.pickTime) {
        dOptions = {
          year: 'numeric',
          month: 'numeric',
          day: 'numeric',
        }
      } else {
        dOptions = {
          year: 'numeric',
          month: 'numeric',
          day: 'numeric',
          hour: 'numeric',
          minute: 'numeric',
        }
      }
    }

    return {
      datesValue,
      timeStartValue,
      timeEndValue,
      formatter: new Intl.DateTimeFormat(this.locale, dOptions),
      isOpened: false,
      timeIndex: 0,
    }
  },

  computed: {
    displayTimestampString (): String {
      if (!this.datesValue && !this.timeStartValue) {
        return ''
      }

      if (this.range) {
        if (this.datesValue?.length === 0 && !this.timeStartValue && this.timeEndValue) {
          return ''
        }
        const d1 = this.datesValue?.[0] ?? '1970-01-01'
        const d2 = this.datesValue?.[1] ?? '1970-01-01'
        const t1 = this.timeStartValue ?? '00:00:00'
        const t2 = this.timeEndValue ?? '00:00:00'

        return this.$vuetify.lang.t('$vuetify.datePickerInput.input',
          this.formatter.format(new Date(`${d1}T${t1}`)),
          this.formatter.format(new Date(`${d2}T${t2}`)),
        )
      } else {
        const time = this.timeStartValue ?? '00:00:00'
        const date = this.datesValue ?? '1970-01-01'
        return this.formatter.format(new Date(date + 'T' + time))
      }
    },
    timestampValue (): Date|Date[]|undefined {
      if (this.range) {
        const d1 = this.datesValue?.[0] ?? '1970-01-01'
        const d2 = this.datesValue?.[1] ?? '1970-01-01'
        const t1 = this.timeStartValue ?? '00:00:00'
        const t2 = this.timeEndValue ?? '00:00:00'
        return [
          new Date(`${d1}T${t1}`),
          new Date(`${d2}T${t2}`),
        ]
      } else {
        const d = this.datesValue ?? '1970-01-01'
        const t = this.timeStartValue ?? '00:00:00'
        return new Date(`${d}T${t}`)
      }
    },
  },

  methods: {
    isDateStringValid (date: string): Boolean {
      const d = new Date(date)
      const s = d.toString()
      return s !== 'Invalid Date'
    },
    genTimePickerDialogItem (): VNode {
      return this.$createElement(
        VCol,
        {
          props: {
            cols: 12,
            sm: 6,
            md: 4,
          },
        },
        [
          this.$createElement(
            VTimePicker,
            {
              props: {
                fullWidth: true,
                color: this.color,
                scrollable: this.scrollable,
                readonly: this.readonly,
                format: this.timeFormat,
                ampmInTitle: true,
                headerColor: this.timeHeaderColor,
                value: this.timeIndex === 0 ? this.timeStartValue : this.timeEndValue,
              },
              on: {
                input: (ev: any) => {
                  if (this.timeIndex === 0) {
                    this.timeStartValue = ev
                  } else {
                    this.timeEndValue = ev
                  }
                  this.$emit('change', this.timestampValue)
                },
              },
            },
            this.range ? [
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
            ] : []
          ),
        ]
      )
    },
    genDatePickerDialogItem (): VNode {
      return this.$createElement(
        VCol,
        {
          props: {
            cols: 12,
            sm: 6,
            md: 8,
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
                value: this.datesValue,
                scrollable: this.scrollable,
                fullWidth: true,
                color: this.color,
                headerColor: this.dateHeaderColor,
              },
              on: {
                input: (ev: any) => {
                  this.datesValue = ev
                  this.$emit('change', this.timestampValue)
                },
              },
            },
          ),
        ]
      )
    },
    genInputDialog (): VNode {
      const dialogItems: VNode[] = []

      if (this.pickDate) {
        dialogItems.push(
          this.genDatePickerDialogItem()
        )
      }

      if (this.pickTime) {
        dialogItems.push(
          this.genTimePickerDialogItem()
        )
      }

      return this.$createElement(
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
                  label: this.label,
                  ...activator.attrs,
                  value: this.displayTimestampString,
                },
                on: {
                  focus: (ev: any) => {
                    activator.on.click(ev)
                  },
                  'click:prepend-inner': (ev: any) => {
                    activator.on.click(ev)
                  },
                  change: (ev: string|null) => {
                    let isValid = true
                    const dateString = ev?.includes('~') ? ev.split('~') : ev
                    if (Array.isArray(dateString)) {
                      for (const i in dateString) {
                        if (!this.isDateStringValid(dateString[i])) {
                          isValid = false
                          break
                        }
                      }
                    } else {
                      if (!this.isDateStringValid(dateString ?? '')) {
                        isValid = false
                      }
                    }

                    if (dateString && isValid) {
                      this.datesValue = dateString
                    } else {
                      if (this.range) {
                        this.datesValue = []
                      } else {
                        this.datesValue = undefined
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
            VCard,
            {
              staticClass: 'ma-0 pa-0',
            },
            [
              this.$createElement(
                VCardText,
                {
                  staticClass: 'ma-0 pa-0',
                },
                [
                  this.$createElement(
                    VRow,
                    {
                      props: {
                        noGutters: true,
                      },
                    },
                    dialogItems,
                  ),
                ]
              ),
              this.$createElement(
                VCardActions,
                {
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
                        },
                      },
                    },
                    this.$vuetify.lang.t('$vuetify.datePickerInput.ok')
                  ),
                ]
              ),
            ]
          ),
        ]
      )
    },
  },

  render (h): VNode {
    return this.genInputDialog()
  },
})
