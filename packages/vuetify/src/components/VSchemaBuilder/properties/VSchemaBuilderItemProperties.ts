import { SchemaRendererComponent, TagAttribute, TagEvent, EventActionType, SchemaRendererBinding, CustomPropertyResolver, EventActionDetails } from 'types/services/schemas'
import Vue, { PropType, VNode } from 'vue'
import { VTab, VTabs, VTabItem, VTabsItems, VTabsSlider } from '../../VTabs'
import { VSchemaBuilderStandardTagAttributes } from '../helpers/TagAttributes'
import VSchemaBuilderItemEvent from './VSchemaBuilderItemEvent'
import VSchemaBuilderItemProperty from './VSchemaBuilderItemProperty'
import VSchemaBuilderAddEvent from './VSchemaBuilderItemAddEvent'
import VSchemaRendererAddBinding from './VSchemaRendererAddBinding'
import VSchemaRendererBinding from './VSchemaRendererBinding'
import { consoleWarn } from '../../../util/console'

import AvailableEvents from './Events'

export default Vue.extend({
  name: 'v-schema-builder-item-properties',

  inheritAttrs: false,

  props: {
    item: {
      type: Object as PropType<SchemaRendererComponent>,
      default: () => (<SchemaRendererComponent>{}),
    },
    properties: Object as PropType<{ [key: string]: any }>,
    customPropertyResolver: null as any as PropType<CustomPropertyResolver>,
  },

  data () {
    const properties = {} as {[key: string]: any}
    const attributes = {} as {[key: string]: any}
    const events = {} as {[key: string]: EventActionType[] }

    Object.entries(this.item).forEach((entry: any[]) => {
      const attr = entry[0]
      const value = entry[1]

      if (attr !== 'props' && attr !== 'on' && attr !== 'parent' && attr !== 'children') {
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
          const AvailableEventsRefs: EventActionDetails[] = Object.values(AvailableEvents)
          eventActions.forEach((eventAct: EventActionType) => {
            const action = AvailableEventsRefs.find((
              avEvent: EventActionDetails) => (avEvent.name === eventName)
            )

            if (action !== null) {
              events[eventName].push({ ...eventAct, ...action })
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
      return this.properties?.events ?? []
    },
    AvailableItemProperties (): any[] {
      const props = this.properties?.attributes
      if (props) {
        return props.sort((a: any, b: any) => a.name.localeCompare(b.name))
      }

      return []
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
            customInputComponent: this.customPropertyResolver?.(this.item, prop),
          },
          on: {
            change: (e: any) => {
              this.$set(this.itemProps, prop.name, e)
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
              this.$set(this.itemAttributes, attr.name, e)
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
                if (index >= 0) {
                  this.$set(this.itemEvents[event.event.name], index, {
                    ...event,
                    details,
                  })
                  this.$emit('change-events', this.itemEvents)
                } else {
                  consoleWarn('out of index update on item event')
                }
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
              'add-binding': (binding: SchemaRendererBinding) => {
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

      (this.itemProps.bindings ?? []).forEach((binding: SchemaRendererBinding) => {
        properties.push(
          this.$createElement(
            VSchemaRendererBinding,
            {
              props: {
                item: this.item,
                binding,
              },
              on: {
                change: (before: SchemaRendererBinding, after: SchemaRendererBinding) => {
                  const bindingIndex = this.itemProps.bindings.map((binding: SchemaRendererBinding) => binding.name).indexOf(before.name)
                  if (bindingIndex >= 0) {
                    this.itemProps.bindings.splice(bindingIndex, 1, after)
                    this.$emit('change-props', this.itemProps)
                    this.$forceUpdate()
                  }
                },
                'remove-binding': (binding: SchemaRendererBinding) => {
                  const bindingIndex = this.itemProps.bindings.map((binding: SchemaRendererBinding) => binding.name).indexOf(binding.name)
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
      if (this.item.tag === 'VSchemaRenderer') {
        return this.GetDynamicPropertiesForSchemaRenderer()
      }

      return this.AvailableItemProperties
        .map((attr: any) => this.GetDynamicInputForItemWithProperty(attr))
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
