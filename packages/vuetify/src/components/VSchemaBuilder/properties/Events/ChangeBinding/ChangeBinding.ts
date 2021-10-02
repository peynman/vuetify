import { VNode, PropType } from 'vue'
import mixins, { ExtractVue } from '../../../../../util/mixins'
import EasyInteracts from '../../../../../mixins/easyinteracts'

import { SchemaRendererComponent, EventActionType } from 'types/services/schemas'
import VTextField from '../../../../VTextField'
import VSelect from '../../../../VSelect'
import VJsonEditor from '../../../../VJsonEditor'
import { VCheckbox } from '../../../../VCheckbox'

const baseMixins = mixins(
  EasyInteracts
  /* @vue/component */
)
interface options extends ExtractVue<typeof baseMixins> {
  $el: HTMLElement
}

export default baseMixins.extend<options>().extend({
  name: 'v-schema-builder-add-event',

  inheritAttrs: false,

  props: {
    item: {
      type: Object as PropType<SchemaRendererComponent>,
      default: () => (<SchemaRendererComponent>{}),
    },
    event: {
      type: Object as PropType<EventActionType>,
      default: () => (<EventActionType>{}),
    },
  },

  data () {
    return {
      details: this.event.details ?? {},
    }
  },

  methods: {
    genEventDetails (): VNode[] {
      const bindingValueInputs = [
        this.$createElement(
          VTextField,
          {
            props: {
              label: 'Value',
              hint: 'Use $() operator to value of another internal binding',
              value: this.details?.value,
            },
            on: {
              change: (e: any) => {
                this.details.value = e
              },
            },
          },
        ),
      ]

      if (this.details.type === 'json') {
        bindingValueInputs.push(
          this.genIconDialog(
            'mdi-widgets',
            'primary',
            'Set binding value to json',
            [
              this.$createElement(
                VJsonEditor,
                {
                  props: {
                    label: 'JSON value',
                    value: this.details?.value,
                  },
                  on: {
                    change: (e: any) => {
                      this.details.value = e
                    },
                  },
                },
              ),
            ],
            null,
            {
              small: true,
              iconProps: {
                small: true,
              },
            },
          )
        )
      }

      return [
        this.$createElement(
          'div',
          {
            staticClass: 'd-flex flex-column flex-grow-1',
          },
          [
            this.$createElement(
              VTextField,
              {
                props: {
                  label: 'Set binding with expression.',
                  hint: 'dont need to use $ operator or start with bindings keyword. use . (dot operator) to set nested value',
                  value: this.details?.binding,
                },
                on: {
                  change: (e: any) => {
                    this.details.binding = e
                  },
                },
              },
            ),
            this.$createElement(
              VSelect,
              {
                props: {
                  label: 'Value type',
                  value: this.details.type,
                  items: [
                    {
                      text: 'String / Expression',
                      value: 'string',
                    },
                    {
                      text: 'Boolean',
                      value: 'boolean',
                    },
                    {
                      value: 'number',
                      text: 'Number',
                    },
                    {
                      value: 'json',
                      text: 'JSON',
                    },
                    {
                      value: 'null',
                      text: 'Null',
                    },
                    {
                      value: 'undefined',
                      text: 'Undefined',
                    },
                  ],
                },
                on: {
                  change: (e: string) => {
                    this.details.type = e
                  },
                },
              }
            ),
            ...bindingValueInputs,
            this.$createElement(
              VCheckbox,
              {
                props: {
                  label: 'Change value in binding recursively.',
                  hint: 'This creates the nested objects in binding if needed',
                  'persistent-hint': true,
                  inputValue: this.details.recursive,
                },
                on: {
                  change: (e: boolean) => {
                    this.details.recursive = e
                  },
                },
              }
            ),
            this.genButton(
              'Save',
              'mdi-save',
              'green',
              () => {
                this.$emit('change', this.details)
              },
              {}
            ),
          ]
        ),
      ]
    },
  },

  render (h): VNode {
    return this.genIconDialog(
      'mdi-details',
      'green',
      'Event #' + this.event.uid + ' Details for item #' + this.item.id,
      this.genEventDetails(),
      () => {
      },
      {
        'x-small': false,
        small: true,
        iconProps: {
          'x-small': false,
          small: true,
        },
      }
    )
  },
})
