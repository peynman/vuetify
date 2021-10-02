import { VNode, PropType } from 'vue'
import mixins, { ExtractVue } from '../../../util/mixins'
import EasyInteracts from '../../../mixins/easyinteracts'

import { SchemaRendererComponent, EventActionType } from 'types/services/schemas'
import { VListItem, VListItemAction, VListItemContent, VListItemTitle, VListItemSubtitle } from '../../VList'
import { VChip } from '../../VChip'

const baseMixins = mixins(
  EasyInteracts
  /* @vue/component */
)
interface options extends ExtractVue<typeof baseMixins> {
  $el: HTMLElement
}

export default baseMixins.extend<options>().extend({
  name: 'v-schema-builder-item-event',

  inheritAttrs: false,

  props: {
    item: {
      type: Object as PropType<SchemaRendererComponent>,
      default: () => ({}),
    },
    event: {
      type: Object as PropType<EventActionType>,
      default: () => (<EventActionType>{}),
    },
  },

  methods: {
    genEventCards (): VNode {
      return this.$createElement(
        VListItem,
        {
          props: {
            elevation: 3,
          },
        },
        [
          this.$createElement(
            VListItemContent,
            {

            },
            [
              this.$createElement(
                VListItemTitle,
                {},
                [
                  'on',
                  this.$createElement(
                    VChip,
                    {
                      staticClass: 'mx-1',
                      props: {
                        dense: true,
                        label: true,
                        small: true,
                      },
                    },
                    this.event.event.name
                  ),
                  'emit',
                  this.$createElement(
                    VChip,
                    {
                      staticClass: 'mx-1',
                      props: {
                        dense: true,
                        label: true,
                        small: true,
                      },
                    },
                    this.event.action
                  ),
                ]
              ),
              this.$createElement(
                VListItemSubtitle,
                {
                },
                [
                  this.$createElement(
                    VChip,
                    {
                      staticClass: 'me-1',
                      props: {
                        dense: true,
                        label: true,
                        'x-small': true,
                      },
                    },
                    this.event.uid
                  ),
                  this.event.event.description,
                ]
              ),
            ]
          ),
          this.$createElement(
            VListItemAction,
            {
            },
            [
              this.genMenu('mdi-minus-circle', 'red', 'Remove event #' + this.event.event.name + '?', this.genRemoveItemMenuContent(() => {
                this.$emit('remove-event', this.item, this.event)
              }), () => {}, {}, {
                'x-small': false,
                small: true,
                iconProps: {
                  small: true,
                  'x-small': false,
                },
              }),
              this.event.genDetailsDialog(this.$createElement, this.item, this.event, (details: any) => {
                this.$emit('change', details)
              }),
            ]
          ),
        ]
      )
    },
  },

  render (h): VNode {
    return this.genEventCards()
  },

})
