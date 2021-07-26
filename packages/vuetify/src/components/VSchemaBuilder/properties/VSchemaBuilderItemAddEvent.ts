import { VNode, PropType } from 'vue'
import mixins, { ExtractVue } from '../../../util/mixins'
import EasyInteracts from './../../../mixins/easyinteracts'

import { SchemaRendererComponent, TagEvent, EventActionType } from 'types/services/schemas'
import { VBtn } from '../../VBtn'
import { VToolbar, VToolbarTitle } from '../../VToolbar'
import { VSpacer, VCol } from '../../VGrid'
import { VSelect } from '../../VSelect'
import { makeRandomId } from './../../../util/helpers'
import * as AvailableEvents from './Events'

export interface SelectableItem {
  name: string
  text: string
}

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
      default: () => ({}),
    },
    events: {
      type: Array as PropType<TagEvent[]>,
      default: () => ([]),
    },
  },

  data () {
    return {
      add_action: null as unknown as SelectableItem | null,
      add_event: null as unknown as TagEvent | null,
    }
  },

  computed: {
    actionTypeList (): SelectableItem[] {
      return Object.values(AvailableEvents).map<SelectableItem>((e: any) => ({
        name: e.default.name,
        text: e.default.text,
      }))
    },
    eventsList (): SelectableItem[] {
      return this.events.map<SelectableItem>((ev: TagEvent) => (<SelectableItem>{ name: ev.name, text: ev.name }))
    },
  },

  methods: {
    genNewEventProperties (): VNode {
      return this.$createElement(
        VCol,
        {
        },
        [
          this.$createElement(
            VSelect,
            {
              props: {
                items: this.eventsList,
                'return-object': true,
                'item-value': 'name',
                label: 'Select when to fire this action',
              },
              on: {
                change: (e: SelectableItem) => {
                  const addEvent = this.events.find((ev: TagEvent) => (e.name === ev.name))
                  if (addEvent !== undefined) {
                    this.add_event = addEvent
                  } else {
                    this.add_event = null
                  }
                },
              },
            },
          ),
          this.$createElement(
            VSelect,
            {
              props: {
                items: this.actionTypeList,
                'return-object': true,
                'item-text': 'text',
                'item-value': 'name',
                label: 'Select what to do',
              },
              on: {
                change: (e: SelectableItem) => {
                  this.add_action = e
                },
              },
            },
          ),
          this.$createElement(
            VBtn,
            {
              props: {
                color: 'success',
                block: true,
              },
              on: {
                click: () => {
                  if (this.add_event != null && this.add_action != null) {
                    const actionEventType = Object.values(AvailableEvents).find(
                      (e: any) => (e.default.name === this.add_action?.name)
                    )

                    if (actionEventType !== undefined) {
                      this.$emit('add-event', <EventActionType>{
                        uid: makeRandomId(10),
                        action: this.add_action.name,
                        event: this.add_event,
                        genDetailsDialog: actionEventType.default.genDetailsDialog,
                      })
                    }
                  }
                },
              },
            },
            'Add Event'
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
        h(VToolbarTitle, {}, 'Events'),
        h(VSpacer, {}),
        this.genMenu(
          'mdi-plus-circle',
          'green',
          'Select new event and its action',
          [this.genNewEventProperties()],
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
