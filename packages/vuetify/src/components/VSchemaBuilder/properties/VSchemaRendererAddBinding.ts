import { VNode, PropType } from 'vue'
import mixins, { ExtractVue } from '../../../util/mixins'
import EasyInteracts from '../../../mixins/easyinteracts'

import { ScehmaRendererBinding, SchemaRendererComponent, SelectableItem } from 'types/services/schemas'
import { VBtn } from '../../VBtn'
import { VToolbar, VToolbarTitle } from '../../VToolbar'
import { VSpacer, VCol } from '../../VGrid'
import { VSelect } from '../../VSelect'
import { VTextField } from '../../VTextField'
import VJsonEditor from '../../VJsonEditor'

const baseMixins = mixins(
  EasyInteracts
  /* @vue/component */
)
interface options extends ExtractVue<typeof baseMixins> {
  $el: HTMLElement
}

export default baseMixins.extend<options>().extend({
  name: 'v-schema-renderer-add-variable',

  inheritAttrs: false,

  props: {
    item: {
      type: Object as PropType<SchemaRendererComponent>,
      default: () => ({}),
    },
  },

  data () {
    return {
      add_name: null as string | null,
      add_type: null as string | null,
      add_default: null as string | null,
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
    genNewBindingProperties (): VNode {
      let valueInput: VNode = this.$createElement(
        VTextField,
        {
          props: {
            label: 'Default value',
            hint: 'default value, this will be decoded before use',
          },
          on: {
            change: (n: any) => {
              this.add_default = n
            },
          },
        },
      )

      if (this.add_type != null && ['object', 'array', 'json'].includes(this.add_type)) {
        valueInput = this.genDialog(
          'JSON Value',
          'mdi-widgets',
          'primary',
          'Create default value as JSON',
          [
            this.$createElement(
              VJsonEditor,
              {
                on: {
                  change: (e: any) => {
                    this.add_default = JSON.stringify(e)
                  },
                },
              }
            ),
          ],
          null,
          {
            'x-small': false,
            block: true,
            icon: false,
            iconProps: {
              'x-small': false,
            },
          }
        )
      }

      return this.$createElement(
        VCol,
        {
        },
        [
          this.$createElement(
            VTextField,
            {
              props: {
                label: 'Binding variable name',
              },
              on: {
                change: (n: any) => {
                  this.add_name = n
                },
              },
            },
          ),
          this.$createElement(
            VSelect,
            {
              props: {
                items: this.variableTypeList,
                'return-object': true,
                'item-text': 'text',
                'item-value': 'name',
                label: 'Select variable type',
              },
              on: {
                change: (e: SelectableItem) => {
                  this.add_type = e.name
                },
              },
            },
          ),
          valueInput,
          this.$createElement(
            VBtn,
            {
              staticClass: 'mt-3',
              props: {
                color: 'success',
                block: true,
              },
              on: {
                click: () => {
                  if (this.add_type != null && this.add_name != null) {
                    this.$emit('add-binding', <ScehmaRendererBinding> {
                      name: this.add_name,
                      default: this.add_default,
                      type: this.add_type,
                    })
                  }
                },
              },
            },
            'Add Binding'
          ),
        ]
      )
    },
  },

  render (h): VNode {
    return h(
      VToolbar,
      {
        props: {
          dense: true,
          flat: true,
        },
      },
      [
        h(VToolbarTitle, {}, 'Variable bindings'),
        h(VSpacer, {}),
        this.genMenu(
          'mdi-plus-circle',
          'green',
          'Add new variable binding',
          [this.genNewBindingProperties()],
          () => {},
          {
            'close-on-content-click': false,
          },
          {
            'x-small': false,
            iconProps: {
              'x-small': false,
            },
          }
        ),
      ]
    )
  },

})
