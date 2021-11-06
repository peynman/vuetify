import { VNode, PropType } from 'vue'
import mixins, { ExtractVue } from '../../../util/mixins'

import { SchemaRendererComponent, TagAttribute } from 'types/services/schemas'
import { VTextField } from '../../VTextField'
import { VCheckbox } from '../../VCheckbox'
import { VSlider } from '../../VSlider'
import { VRow, VCol } from '../../VGrid'
import { VBtn } from '../../VBtn'
import { VIcon } from '../../VIcon'
import { VCard } from '../../VCard'
import { VInput } from '../../VInput'
import { VJsonEditor } from '../../VJsonEditor'
import EasyInteracts from '../../../mixins/easyinteracts'
import { AsyncComponentFactory } from 'vue/types/options'

const baseMixins = mixins(
  EasyInteracts
  /* @vue/component */
)
interface options extends ExtractVue<typeof baseMixins> {
  $el: HTMLElement
}

export default baseMixins.extend<options>().extend({

  name: 'v-schema-builder-item-property',

  inheritAttrs: false,

  props: {
    item: {
      type: Object as PropType<SchemaRendererComponent>,
      default: () => (<SchemaRendererComponent>{}),
    },
    attribute: {
      type: Object as PropType<TagAttribute>,
      default: () => (<TagAttribute>{}),
    },
    value: null as any as PropType<any>,
    customInputComponent: null as any as PropType<AsyncComponentFactory>,
  },

  data () {
    return {
      asyncComponents: {} as { [key: string]: any },
      binded: this.value?.startsWith?.('$') || (this.attribute.autoBind && this.value),
    }
  },

  methods: {
    getAttributeInput (): VNode {
      if (this.customInputComponent) {
        return this.$createElement(
          this.customInputComponent,
          {
            props: {
              label: this.attribute.name,
              hint: this.attribute.description,
              value: this.value,
            },
            on: {
              input: (e: any) => {
                this.$emit('change', e)
              },
            },
          },
        )
      }
      switch (this.attribute.value?.type) {
        case 'object':
          return this.$createElement(
            VInput,
            {
              props: {
                label: this.attribute.name,
                hint: this.attribute.description,
                showHint: true,
                'persistent-hint': true,
              },
            },
            [
              this.genDialog(
                'JSON Object',
                'mdi-widgets',
                'secondary',
                'Create object JSON',
                [this.$createElement(
                  VJsonEditor,
                  {
                    props: {
                      value: this.value,
                      canChangeRootType: false,
                      startType: 'object',
                    },
                    on: {
                      change: (e: any) => {
                        this.$emit('change', e)
                      },
                    },
                  }
                )],
                null,
                {
                  'x-small': false,
                  icon: false,
                  iconProps: {
                    'x-small': false,
                  },
                }
              ),
            ]
          )
        case 'array':
          return this.$createElement(
            VInput,
            {
              props: {
                label: this.attribute.name,
                hint: this.attribute.description,
                showHint: true,
                'persistent-hint': true,
              },
            },
            [
              this.genDialog(
                'JSON Object',
                'mdi-widgets',
                'secondary',
                'Create object JSON',
                [this.$createElement(
                  VJsonEditor,
                  {
                    props: {
                      value: this.value,
                      canChangeRootType: false,
                      startType: 'array',
                    },
                    on: {
                      change: (e: any) => {
                        this.$emit('change', e)
                      },
                    },
                  }
                )],
                null,
                {
                  'x-small': false,
                  icon: false,
                  iconProps: {
                    'x-small': false,
                  },
                }
              ),
            ]
          )
        case 'number':
          return this.$createElement(
            VTextField,
            {
              props: {
                label: this.attribute.name,
                hint: this.attribute.description,
                showHint: true,
                'persistent-hint': true,
                value: this.value,
              },
              on: {
                change: (e: any) => {
                  this.$emit('change', e)
                },
              },
            }
          )
        case 'boolean':
          return this.$createElement(
            VCheckbox,
            {
              props: {
                label: this.attribute.name,
                hint: this.attribute.description,
                showHint: true,
                'persistent-hint': true,
                'input-value': this.value,
              },
              on: {
                change: (e: any) => {
                  this.$emit('change', e)
                },
              },
            }
          )
        case 'custom':
          if (this.attribute.tag) {
            if (!this.asyncComponents[this.attribute.tag]) {
              this.asyncComponents[this.attribute.tag] = this.attribute.factory
            }
            const props = typeof this.attribute.props === 'function'
              ? this.attribute.props(this) : this.attribute.props ?? {}
            return this.$createElement(
              this.asyncComponents[this.attribute.tag],
              {
                props: {
                  label: this.attribute.name,
                  hint: this.attribute.description,
                  value: this.value,
                  ...(props ?? {}),
                },
                on: {
                  input: (e: any) => {
                    this.$emit('change', e)
                  },
                },
              }
            )
          }
      }
      if (this.attribute.name === 'elevation') {
        return this.$createElement(
          VSlider,
          {
            props: {
              label: this.attribute.name,
              hint: this.attribute.description,
              showHint: true,
              'persistent-hint': true,
              min: 0,
              max: 24,
              value: this.value,
            },
            on: {
              change: (e: any) => {
                this.$emit('change', e)
              },
            },
          }
        )
      } else {
        return this.$createElement(
          VTextField,
          {
            props: {
              label: this.attribute.name,
              hint: this.attribute.description,
              showHint: true,
              'persistent-hint': true,
              value: this.value,
            },
            on: {
              change: (e: any) => {
                this.$emit('change', e)
              },
            },
          }
        )
      }
    },

    getAttributeBindingInput (): VNode {
      return this.$createElement(
        VTextField,
        {
          props: {
            label: 'Bind ' + this.attribute.name + ' to an expression',
            hint: this.attribute.description,
            showHint: true,
            'persistent-hint': true,
            value: this.value,
          },
          on: {
            change: (e: any) => {
              this.$emit('change', e)
            },
          },
        }
      )
    },
  },

  render (h): VNode {
    return h(
      VCard,
      {
        staticClass: this.binded ? 'my-1' : '',
        props: {
          dark: this.binded,
          shaped: this.binded,
          elevation: 0,
        },
      },
      [
        h(
          VRow,
          {
            props: {
              'no-gutters': true,
              justfiy: 'center',
              align: 'center',
            },
          },
          [
            h(
              VCol,
              {
                props: {
                  cols: 1,
                },
              },
              [
                this.attribute.cantBind === true ? '' : h(
                  VBtn,
                  {
                    props: {
                      icon: true,
                    },
                    on: {
                      click: () => {
                        this.binded = !this.binded
                      },
                    },
                  },
                  [
                    h(
                      VIcon,
                      {
                        props: {
                          small: true,
                        },
                      },
                      'mdi-widgets'
                    ),
                  ]
                ),
              ]
            ),
            h(
              VCol,
              {
                props: {
                  cols: 11,
                },
              },
              [
                this.binded ? this.getAttributeBindingInput() : this.getAttributeInput(),
              ]
            ),
          ]
        ),
      ],
    )
  },

})
