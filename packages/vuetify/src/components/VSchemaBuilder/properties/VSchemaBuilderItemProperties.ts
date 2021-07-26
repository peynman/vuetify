import { SchemaRendererComponent, TagAttribute, TagEvent, EventActionType, ScehmaRendererBinding } from 'types/services/schemas'
import Vue, { PropType, VNode } from 'vue'
import { VTab, VTabs, VTabItem, VTabsItems, VTabsSlider } from '../../VTabs'
import { VSchemaBuilderStandardTagAttributes } from '../helpers/TagAttributes'
import WEBTYPES from '../helpers/TagHelpers'
import VSchemaBuilderItemEvent from './VSchemaBuilderItemEvent'
import VSchemaBuilderItemProperty from './VSchemaBuilderItemProperty'
import VSchemaBuilderAddEvent from './VSchemaBuilderItemAddEvent'
import VSchemaRendererAddBinding from './VSchemaRendererAddBinding'
import VSchemaRendererBinding from './VSchemaRendererBinding'

import * as AvailableEvents from './Events'

export default Vue.extend({
  name: 'v-schema-builder-item-properties',

  inheritAttrs: false,

  props: {
    item: {
      type: Object as PropType<SchemaRendererComponent>,
      default: () => (<SchemaRendererComponent>{}),
    },
  },

  data () {
    const properties = {} as {[key: string]: any}
    const attributes = {} as {[key: string]: any}
    const events = {} as {[key: string]: EventActionType[] }

    Object.entries(this.item).forEach((entry: any[]) => {
      const attr = entry[0]
      const value = entry[1]

      if (attr !== 'props' && attr !== 'on') {
        attributes[attr] = value
      } else if (attr === 'props') {
        for (const prop in value) {
          properties[prop] = value[prop]
        }
      } else if (attr === 'on') {
        Object.entries(value).forEach((entry: any) => {
          const eventName = entry[0]
          const eventActions = entry[1]
          events[eventName] = []
          eventActions.forEach((eventAct: EventActionType) => {
            const actionRef = Object.values(AvailableEvents).find((e: any) => {
              return e.default.name === eventAct.action
            })

            if (actionRef !== null) {
              events[eventName].push({ ...eventAct, ...actionRef?.default })
            }
          })
        })
      }
    })

    return {
      currentTab: 0,
      itemProps: properties,
      itemAttributes: attributes,
      itemEvents: events,
    }
  },

  computed: {
    availableItemEvents (): TagEvent[] {
      const events: TagEvent[] = []
      WEBTYPES.contributions.html.tags.forEach((tag: any) => {
        if (this.item.tag === tag.name) {
          tag.events.forEach((e: any) => { events.push(e) })
        }
      })
      return events
    },
  },

  methods: {
    GetDynamicInputForItemWithProperty (prop: TagAttribute): VNode {
      return this.$createElement(
        VSchemaBuilderItemProperty,
        {
          props: {
            item: this.item,
            attribute: prop,
            value: this.itemProps[prop.name],
          },
          on: {
            change: (e: any) => {
              this.itemProps[prop.name] = e
              this.$emit('change-props', this.itemProps)
            },
          },
        }
      )
    },

    GetDynamicInputForItemWithAttribute (attr: TagAttribute): VNode {
      return this.$createElement(
        VSchemaBuilderItemProperty,
        {
          props: {
            item: this.item,
            attribute: attr,
            value: this.itemAttributes[attr.name],
          },
          on: {
            change: (e: any) => {
              this.itemAttributes[attr.name] = e
              this.$emit('change-attributes', this.itemAttributes)
            },
          },
        }
      )
    },

    GetDynamicInputForItemWithEvent (event: EventActionType): VNode {
      return this.$createElement(
        VSchemaBuilderItemEvent,
        {
          props: {
            item: this.item,
            event,
          },
          on: {
            change: (details: { [key: string]: any }) => {
              if (this.itemEvents[event.event.name]) {
                const index = this.itemEvents[event.event.name].indexOf(event)
                this.itemEvents[event.event.name][index].details = details
                this.$emit('change-events', this.itemEvents)
              }
            },
            'remove-event': (item: SchemaRendererComponent, event: EventActionType) => {
              if (this.itemEvents[event.event.name]) {
                const index = this.itemEvents[event.event.name].indexOf(event)
                if (index >= 0) {
                  this.itemEvents[event.event.name].splice(index, 1)
                  this.$emit('change-events', this.itemEvents)
                  this.$forceUpdate()
                }
              }
            },
          },
        }
      )
    },

    GetDynamicPropertiesForSchemaRenderer (): VNode[] {
      const properties: VNode[] = [
        this.$createElement(
          VSchemaRendererAddBinding,
          {
            props: {
              item: this.item,
            },
            on: {
              'add-binding': (binding: ScehmaRendererBinding) => {
                if (!this.itemProps.bindings) {
                  this.itemProps.bindings = []
                }
                this.itemProps.bindings.push(binding)
                this.$emit('change-props', this.itemProps)
                this.$forceUpdate()
              },
            },
          },
        ),
      ];

      (this.itemProps.bindings ?? []).forEach((binding: ScehmaRendererBinding) => {
        properties.push(
          this.$createElement(
            VSchemaRendererBinding,
            {
              props: {
                item: this.item,
                binding,
              },
              on: {
                change: (before: ScehmaRendererBinding, after: ScehmaRendererBinding) => {
                  const bindingIndex = this.itemProps.bindings.map((binding: ScehmaRendererBinding) => binding.name).indexOf(before.name)
                  if (bindingIndex >= 0) {
                    this.itemProps.bindings.splice(bindingIndex, 1, after)
                    this.$emit('change-props', this.itemProps)
                    this.$forceUpdate()
                  }
                },
                'remove-binding': (binding: ScehmaRendererBinding) => {
                  const bindingIndex = this.itemProps.bindings.map((binding: ScehmaRendererBinding) => binding.name).indexOf(binding.name)
                  if (bindingIndex >= 0) {
                    this.itemProps.bindings.splice(bindingIndex, 1)
                    this.$emit('change-props', this.itemProps)
                    this.$forceUpdate()
                  }
                },
              },
            }
          )
        )
      })

      return properties
    },

    GetDynamicPropertiesForItem (): VNode[] {
      const properties: VNode[] = []
      if (this.item.tag === 'VSchemaRenderer') {
        return this.GetDynamicPropertiesForSchemaRenderer()
      }

      WEBTYPES.contributions.html.tags.forEach((tag: any) => {
        if (this.item.tag === tag.name) {
          properties.push(...tag.attributes.sort(
            (a: any, b: any) => a.name.localeCompare(b.name)
          ).map((attr: any) => this.GetDynamicInputForItemWithProperty(attr)))
        }
      })
      return properties
    },

    GetDynamicAttributesForItem (): VNode[] {
      return VSchemaBuilderStandardTagAttributes.map((attr: any) => this.GetDynamicInputForItemWithAttribute(attr))
    },

    GetDynmaicEventsForItem (): VNode[] {
      const eventNodes: VNode[] = []
      eventNodes.unshift(this.GetAddEventToolbar(this.availableItemEvents))

      Object.entries(this.itemEvents).forEach((entry: any[]) => {
        const events = entry[1] as EventActionType[]
        events.forEach((event: EventActionType) => {
          eventNodes.push(this.GetDynamicInputForItemWithEvent(event))
        })
      })

      return eventNodes
    },

    GetAddEventToolbar (events: TagEvent[]): VNode {
      return this.$createElement(
        VSchemaBuilderAddEvent,
        {
          props: {
            events,
          },
          on: {
            'add-event': (e: EventActionType) => {
              if (this.itemEvents[e.event.name] === undefined) {
                this.itemEvents[e.event.name] = []
              }
              this.itemEvents[e.event.name].push(e)
              this.$emit('change-events', this.itemEvents)
              this.$forceUpdate()
            },
          },
        },
      )
    },
  },

  render (h): VNode {
    const settingsHeaders = [
      h(VTabsSlider),
      h(VTab, {}, 'Attributes'),
      h(VTab, {}, this.item.tag === 'VSchemaRenderer' ? 'Bindings' : 'Properties'),
    ]
    const settingsContent = [
      h(VTabItem, {}, this.GetDynamicAttributesForItem()),
      h(VTabItem, {}, this.GetDynamicPropertiesForItem()),
    ]

    if (this.availableItemEvents.length > 0) {
      settingsContent.push(h(VTabItem, {}, this.GetDynmaicEventsForItem()))
      settingsHeaders.push(h(VTab, {}, 'Events'))
    }

    return h(
      'div',
      {
        staticClass: 'flex-grow-1',
      },
      [
        h(
          VTabs,
          {
            props: {
              centered: true,
              value: this.currentTab,
            },
            on: {
              change: (e: any) => {
                this.currentTab = e
              },
            },
          },
          settingsHeaders
        ),
        h(
          VTabsItems,
          {
            props: {
              value: this.currentTab,
            },
          },
          settingsContent
        ),
      ]
    )
  },

})
