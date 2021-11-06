import { ApiMethod, CrudFormInput, CrudUser, CrudFormInputTab } from 'types/services/crud'
import { SchemaRendererAgent, SchemaRendererBinding, SchemaRendererComponent } from 'types/services/schemas'
import { PropType } from 'vue'
import mixins, { ExtractVue } from '../../util/mixins'
import { getNestedObjectValue } from './util/helpers'

import CrudConsumer from './CrudConsumer'
import { VNode } from 'vue/types/umd'
import VSchemaRenderer from '../VSchemaRenderer'

const baseMixins = mixins(
  CrudConsumer,
  /* @vue/component */
)
interface options extends ExtractVue<typeof baseMixins> {
  $el: HTMLElement
}

export default baseMixins.extend<options>().extend({
  name: 'v-crud-api-form',

  inheritAttrs: false,

  props: {
    id: String,
    api: String,
    title: {
      type: String as PropType<String | undefined>,
    },
    isAction: Boolean,
    loading: Boolean,
    crudUser: {
      type: Object as PropType<CrudUser> | undefined,
      default: undefined,
    },
    showForm: {
      type: Boolean,
      default: true,
    },
    extraActions: Array as PropType<Array<SchemaRendererComponent>>,
    value: {
      type: Object as PropType<{ [key: string]: any }> | undefined,
      default: undefined,
    },
  },

  data () {
    return {
      formValues: (this.value || {}) as { [key: string]: any },
    }
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

  computed: {
    apiMethod (): ApiMethod|undefined {
      if (this.isAction) {
        return this.crudResource?.actions?.[this.api].api
      } else {
        return this.crudResource?.api?.[this.api]
      }
    },
    canViewApiForm (): Boolean {
      if (this.apiMethod) {
        return this.crudUser?.hasAccessToApiMethod(this.apiMethod) && this.showForm
      }

      return this.showForm
    },
    formBindings (): SchemaRendererBinding[] {
      const bindings = []
      if (this.apiMethod?.autoValidate) {
        bindings.push({
          name: 'valid',
          type: 'bool',
          default: this.formValues?.valid !== undefined ? this.formValues?.valid : true,
        })
      }
      if (this.apiMethod?.form) {
        this.apiMethod.form.forEach((input: CrudFormInput) => {
          if (!input.key.includes('.')) {
            bindings.push({
              name: input.key,
              type: 'default',
              default: getNestedObjectValue(this.formValues, input.key, null),
            })
          }
        })
      }
      if (this.apiMethod?.bindings) {
        this.apiMethod?.bindings.forEach((binding: SchemaRendererBinding) => {
          bindings.push({
            name: binding.name,
            type: binding.type,
            default: getNestedObjectValue(this.formValues, binding.name, binding.default),
          })
        })
      }
      return bindings
    },
    hasTabs (): Boolean {
      return (this.apiMethod?.formTabs?.length ?? 0) > 1
    },
  },

  methods: {
    genSchemaFormCard (
      title: string,
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
            children: [{
              tag: 'VCard',
              children: [
                {
                  tag: 'VCardTitle',
                  children: title,
                },
                {
                  tag: 'VDivider',
                },
                ...(this.loading ? [{
                  tag: 'VProgressLinear',
                  props: {
                    indeterminate: true,
                  },
                }] : []),
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
            }],
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
      const genFormComponentFromInput = (input: CrudFormInput) => {
        const props = input.component?.props ?? {}
        if (input.rules) {
          props.rules = input.rules
        }
        return {
          id: `${this.id}-${this.api}-${input.key}`,
          ...(input.component ?? {}),
          'v-model': '$(bindings.' + input.key + ')',
          props,
        }
      }

      if (this.hasTabs) {
        const tabContents: SchemaRendererComponent[] = []
        this.apiMethod?.formTabs?.forEach((tab: CrudFormInputTab, index: number) => {
          tabContents.push({
            tag: 'VTabItem',
            children: this.apiMethod?.form?.filter(
              (input: CrudFormInput) => input.tab === tab.value || (!input.tab && index === 0)
            ).map<SchemaRendererComponent>(genFormComponentFromInput) ?? [],
          })
        })

        return [
          {
            tag: 'VTabs',
            'v-model': '$(bindings.__tabIndex)',
            props: {
              centered: true,
            },
            children: [
              {
                tag: 'VTabsSlider',
              },
              ...(this.apiMethod?.formTabs?.map((tab: CrudFormInputTab) => ({
                tag: 'VTab',
                children: tab.text,
              })) ?? []),
            ],
          },
          {
            tag: 'VDivider',
          },
          {
            tag: 'VTabsItems',
            'v-model': '$(bindings.__tabIndex)',
            children: tabContents,
          },
        ]
      } else {
        return this.apiMethod?.form?.map<SchemaRendererComponent>(genFormComponentFromInput) ?? []
      }
    },
    getApiFormActionButtons (): SchemaRendererComponent[] {
      return [
        ...(this.apiMethod?.actions ?? []),
        ...((this.apiMethod?.actions?.length ?? 0) > 0 ? [{
          tag: 'VSpacer',
        }] : []),
        ...(this.extraActions ?? []),
      ]
    },
    genApiForm (): VNode {
      const schema: { [key: string]: any } = {
        staticClass: 'd-flex flex-column',
        children: this.getApiFormComponents(),
      }
      if (this.apiMethod?.autoValidate) {
        schema.tag = 'VForm'
        schema['v-model'] = '$(bindings.valid)'
        schema.ref = 'form'
      } else {
        schema.tag = 'div'
      }

      let title: String|undefined = this.title
      if (!title) {
        title = typeof this.apiMethod?.title === 'function' ? this.apiMethod?.title(this, this.crudResource, this.api) : this.apiMethod?.title
      }
      return this.genSchemaFormCard(
        title?.toString() ?? '',
        this.formBindings,
        schema,
        this.getApiFormActionButtons()
      )
    },
  },

  render (h): VNode {
    return this.genApiForm()
  },
})
