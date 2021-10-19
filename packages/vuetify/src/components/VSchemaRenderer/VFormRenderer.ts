import { CrudFormInput } from 'types/services/crud'
import { SchemaRendererAgent, SchemaRendererBinding, SchemaRendererComponent } from 'types/services/schemas'
import Vue, { PropType } from 'vue'
import { getNestedObjectValue } from '../VCrud/util/helpers'

import { VNode } from 'vue/types/umd'
import VSchemaRenderer from '../VSchemaRenderer'

export default Vue.extend({
  name: 'v-crud-api-form',

  inheritAttrs: false,

  props: {
    id: String,
    isAction: Boolean,
    title: String,
    loading: Boolean,
    autoValidate: Boolean,
    showForm: {
      type: Boolean,
      default: true,
    },
    extraActions: Array as PropType<Array<SchemaRendererComponent>>,
    value: {
      type: Object as PropType<{ [key: string]: any }> | undefined,
      default: undefined,
    },
    form: Array as PropType<Array<CrudFormInput>>,
    bindings: Array as PropType<Array<SchemaRendererBinding>>,
    actions: Array as PropType<Array<SchemaRendererComponent>>,
  },

  data () {
    return {
      formValues: (this.value || {}) as { [key: string]: any },
    }
  },

  computed: {
    formBindings (): SchemaRendererBinding[] {
      const bindings = []
      if (this.autoValidate) {
        bindings.push({
          name: 'valid',
          type: 'bool',
          default: this.formValues?.valid !== undefined ? this.formValues?.valid : true,
        })
      }
      if (this.form) {
        this.form.forEach((input: CrudFormInput) => {
          if (!input.key.includes('.')) {
            bindings.push({
              name: input.key,
              type: 'default',
              default: getNestedObjectValue(this.formValues, input.key, null),
            })
          }
        })
      }
      if (this.bindings) {
        this.bindings.forEach((binding: SchemaRendererBinding) => {
          bindings.push({
            name: binding.name,
            type: binding.type,
            default: getNestedObjectValue(this.formValues, binding.name, binding.default),
          })
        })
      }
      return bindings
    },
  },

  watch: {
    value: {
      deep: true,
      handler () {
        this.formValues = this.value
        const agent = this.$refs.renderer as unknown as SchemaRendererAgent
        if (agent) {
          agent.resetBindingValues()
        }
      },
    },
  },

  methods: {
    genSchemaFormCard (
      bindings: Array<SchemaRendererBinding>,
      formSchema: SchemaRendererComponent,
      actionsSchema: Array<SchemaRendererComponent>
    ): VNode {
      return this.$createElement(
        VSchemaRenderer,
        {
          ref: 'renderer',
          props: {
            bindings,
            children:
            [
              {
                tag: 'VCardText',
                children: [formSchema],
              },
              {
                tag: 'VDivider',
              },
              {
                tag: 'VCardActions',
                children: actionsSchema,
              },
            ],
          },
          on: {
            input: (bindings: { [key: string]: any }) => {
              this.$emit('input', bindings)
            },
          },
        }
      )
    },
    getApiFormComponents (): SchemaRendererComponent[] {
      return this.form?.map<SchemaRendererComponent>((input: CrudFormInput) => {
        const props = input.component?.props ?? {}
        if (input.rules) {
          props.rules = input.rules
        }
        return {
          id: `${this.id}-${input.key}`,
          ...(input.component ?? {}),
          'v-model': 'bindings.' + input.key,
          props,
        }
      }) ?? []
    },
    getApiFormActionButtons (): SchemaRendererComponent[] {
      return [
        ...(this.extraActions ?? []),
        ...(this.actions ?? []),
      ]
    },
    genForm (): VNode {
      const schema: { [key: string]: any } = {
        staticClass: 'd-flex flex-column',
        children: this.getApiFormComponents(),
      }
      if (this.autoValidate) {
        schema.tag = 'VForm'
        schema['v-model'] = '$(bindings.valid)'
        schema.ref = 'form'
      } else {
        schema.tag = 'div'
      }

      return this.genSchemaFormCard(
        this.formBindings,
        schema,
        this.getApiFormActionButtons()
      )
    },
  },

  render (h): VNode {
    return this.genForm()
  },
})
