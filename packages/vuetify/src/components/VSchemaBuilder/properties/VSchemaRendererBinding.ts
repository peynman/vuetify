import { VNode, PropType } from 'vue'
import mixins, { ExtractVue } from '../../../util/mixins'
import EasyInteracts from '../../../mixins/easyinteracts'

import { SchemaRendererBinding, SchemaRendererComponent, SelectableItem } from 'types/services/schemas'
import { VTextField } from '../../VTextField'
import { VRow, VCol } from '../../VGrid'
import { VSelect } from '../../VSelect'
import { VJsonEditor } from '../../VJsonEditor'
import { VCard, VCardTitle } from '../../VCard'

const baseMixins = mixins(
  EasyInteracts
  /* @vue/component */
)
interface options extends ExtractVue<typeof baseMixins> {
  $el: HTMLElement
}

export default baseMixins.extend<options>().extend({
  name: 'v-schema-renderer-variable-input',

  inheritAttrs: false,

  props: {
    item: {
      type: Object as PropType<SchemaRendererComponent>,
      default: () => (<SchemaRendererComponent>{}),
    },
    binding: {
      type: Object as PropType<SchemaRendererBinding>,
      default: () => (<SchemaRendererBinding>{}),
    },
  },

  data () {
    return {
      default: this.binding.default,
      type: this.binding.type,
      name: this.binding.name,
      changed: false,
    }
  },

  computed: {
    variableTypeList (): SelectableItem[] {
      return [
        <SelectableItem> {
          name: 'string',
          text: 'String',
        },
        <SelectableItem> {
          name: 'boolean',
          text: 'Boolean',
        },
        <SelectableItem> {
          name: 'number',
          text: 'Number',
        },
        <SelectableItem> {
          name: 'json',
          text: 'JSON',
        },
      ]
    },
  },

  methods: {
    genBindingCards (): VNode {
      const actions: VNode[] = [
        this.genMenu(
          'mdi-minus-circle',
          'red',
          'Remove binding ' + this.binding.name + '?',
          this.genRemoveItemMenuContent(() => {
            this.$emit('remove-binding', this.binding)
          }),
          () => {},
          {},
          {
            small: true,
            iconProps: {
              small: true,
            },
          }
        ),
      ]
      if (['json', 'array', 'object'].includes(this.type)) {
        actions.unshift(
          this.genIconDialog(
            'mdi-widgets',
            'primary',
            'Change JSON default value',
            [this.$createElement(
              VJsonEditor,
              {
                props: {
                  value: this.default,
                },
                on: {
                  change: (n: any) => {
                    this.default = JSON.stringify(n)
                    this.changed = true
                  },
                },
              },
            )], null, {
              small: true,
              iconProps: {
                small: true,
              },
            }
          )
        )
      }
      if (this.changed) {
        actions.push(
          this.genIconButton(
            'mdi-check-circle',
            'green',
            () => {
              this.$emit('change', this.binding, <SchemaRendererBinding> {
                name: this.name,
                type: this.type,
                default: this.default,
              })
              this.changed = false
            },
            {
              small: true,
              iconProps: {
                small: true,
              },
            }
          ),
        )
        actions.push(
          this.genIconButton(
            'mdi-cancel',
            'warning',
            () => {
              this.default = this.binding.default
              this.name = this.binding.name
              this.type = this.binding.type
              this.changed = false
            },
            {
              small: true,
              iconProps: {
                small: true,
              },
            }
          ),
        )
      }

      return this.$createElement(
        VCard,
        {
          staticClass: 'ma-2',
          props: {
            elevation: 3,
          },
        },
        [
          this.$createElement(
            VCardTitle,
            {
              staticClass: 'ma-1 px-2 pb-2',
            },
            [
              this.$createElement(
                VRow,
                {
                  props: {
                    'no-gutters': true,
                    justify: 'center',
                    align: 'center',
                  },
                },
                [
                  this.$createElement(
                    VCol,
                    {
                      props: {
                        cols: 11,
                      },
                    },
                    [
                      this.$createElement(
                        VRow,
                        {
                          props: {
                            'no-gutters': true,
                            justify: 'center',
                            align: 'center',
                          },
                        },
                        [
                          this.$createElement(
                            VTextField,
                            {
                              staticClass: 'mx-1',
                              props: {
                                label: 'Binding variable name',
                                dense: true,
                                value: this.name,
                                'hide-details': true,
                              },
                              on: {
                                change: (n: any) => {
                                  this.name = n
                                  this.changed = true
                                },
                              },
                            },
                          ),
                          this.$createElement(
                            VSelect,
                            {
                              staticClass: 'mx-1',
                              props: {
                                dense: true,
                                label: 'Variable type',
                                'item-value': 'name',
                                items: this.variableTypeList,
                                value: this.type,
                                'hide-details': true,
                              },
                              on: {
                                change: (n: string) => {
                                  this.type = n
                                  this.changed = true
                                },
                              },
                            },
                          ),
                          this.$createElement(
                            VTextField,
                            {
                              staticClass: 'mx-1',
                              props: {
                                dense: true,
                                label: 'Default value',
                                'hide-details': true,
                                value: this.default,
                                clearable: true,
                              },
                              on: {
                                change: (n: any) => {
                                  this.default = n
                                  this.changed = true
                                },
                              },
                            },
                          ),
                        ]
                      ),
                    ],
                  ),
                  this.$createElement(
                    VCol,
                    {
                      staticClass: 'd-flex align-center justify-center',
                      props: {
                        cols: 1,
                      },
                    },
                    actions
                  ),
                ]
              ),
            ]
          ),
        ],
      )
    },

  },

  render (h): VNode {
    return this.genBindingCards()
  },
})
