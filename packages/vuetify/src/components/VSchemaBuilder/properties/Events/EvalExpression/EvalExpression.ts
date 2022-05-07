import { VNode, PropType } from 'vue'
import mixins, { ExtractVue } from '../../../../../util/mixins'
import EasyInteracts from '../../../../../mixins/easyinteracts'

import { SchemaRendererComponent, EventActionType } from 'types/services/schemas'
import VTextField from '../../../../VTextField'

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
              label: 'Expression',
              hint: 'Javascript expression to run, available variable names are :renderer, item, event, eventArgs, argsBindings',
              value: this.details?.expression,
            },
            on: {
              change: (e: any) => {
                this.details.expression = e
              },
            },
          },
        ),
      ]

      return [
        this.$createElement(
          'div',
          {
            staticClass: 'd-flex flex-column flex-grow-1',
          },
          [
            ...bindingValueInputs,
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
