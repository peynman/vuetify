import Vue, { VNode } from 'vue'
import { AsyncComponentFactory, PropType } from 'vue/types/options'
import { SchemaRendererComponent, EventActionType, EventActionDetails, SchemaRendererBinding } from 'types/services/schemas'
import { cloneObjectWithParent, mergeDeep } from '../../util/helpers'
import * as AvailableEvents from '../VSchemaBuilder/properties/Events'
import { ScopedSlot } from 'vue/types/vnode'
import { consoleError } from '../../util/console'
import VSchemaBuilderAppend from '../VSchemaBuilder/VSchemaBuilderAppend'

export default Vue.extend({
  name: 'v-schema-renderer',

  inheritAttrs: false,

  props: {
    children: {
      type: Array as PropType<Array<SchemaRendererComponent>>,
      default: () => ([]),
    },
    bindings: {
      type: Array as PropType<Array<SchemaRendererBinding>>,
      default: () => ([]),
    },
    editorMode: {
      type: Boolean,
      default: false,
    },
    componentsDictionary: {
      type: Object as PropType<{ [key: string]: AsyncComponentFactory }>,
      default: () => ({}),
    },
    wrap: String,
    wrapClass: String,
    wrapAttributes: Array,
    attributes: Object,
    bindingMergeDepth: {
      type: Number,
      default: 1,
    },
    value: {
      type: Object as PropType<{ [key: string]: any }>,
      default: () => ({} as { [key: string]: any }),
    },
  },

  data () {
    return {
      internalBindings: this.value ?? {},
      editableItems: {} as { [key: string]: any },
      asyncComponents: {} as { [key: string]: any },
    }
  },

  computed: {
    inputBindingValues (): { [key: string]: any } {
      const inputBindingValues: {[key: string]: any} = {}
      this.bindings?.forEach((binding: SchemaRendererBinding) => {
        if (['object', 'array', 'json', 'number', 'boolean'].includes(binding.type)) {
          try {
            const defaultValue = binding.default === null ? null : JSON.parse(binding.default)
            inputBindingValues[binding.name] = defaultValue
          } catch (error) {
            consoleError(error)
          }
        } else if (binding.type === 'promise') {
          binding.default(this).then((v: any) => {
            inputBindingValues[binding.name] = v
            this.$forceUpdate()
          })
        } else {
          if (typeof binding.default === 'function') {
            inputBindingValues[binding.name] = binding.default(this)
          } else {
            if (typeof binding.default === 'object' && binding.default !== null) {
              if (Array.isArray(binding.default)) {
                inputBindingValues[binding.name] = [...binding.default]
              } else {
                inputBindingValues[binding.name] = { ...binding.default }
              }
            } else {
              inputBindingValues[binding.name] = binding.default
            }
          }
        }
      })
      return inputBindingValues
    },
  },

  methods: {
    resetBindingValues (): void {
      this.internalBindings = {}
      this.$forceUpdate()
    },
    getBindingValues (): { [key: string]: any } {
      const bindingValues: { [key: string]: any } = {}

      Object.keys(this.inputBindingValues).forEach((k: string) => {
        if (typeof this.inputBindingValues[k] === 'object' && this.inputBindingValues[k] !== null) {
          if (Array.isArray(this.inputBindingValues[k])) {
            bindingValues[k] = mergeDeep([], this.inputBindingValues[k])
          } else {
            bindingValues[k] = mergeDeep({}, this.inputBindingValues[k])
          }
        } else {
          bindingValues[k] = this.inputBindingValues[k]
        }
      })
      Object.keys(this.internalBindings).forEach((k: string) => {
        if (bindingValues.hasOwnProperty(k) && typeof bindingValues[k] === 'object') {
          if (bindingValues[k] && this.internalBindings[k]) {
            if (Array.isArray(bindingValues[k])) {
              bindingValues[k] = this.internalBindings[k]
            } else {
              bindingValues[k] = {
                ...bindingValues[k],
                ...this.internalBindings[k],
              }
            }
          } else {
            bindingValues[k] = this.internalBindings[k]
          }
        } else {
          bindingValues[k] = this.internalBindings[k]
        }
      })

      return bindingValues
    },
    // schema renderer agent methods
    setBindingValue (key: string, value: any, recursive: boolean): void {
      let bindingRefKey = key
      if (key.startsWith('$')) {
        if (key.startsWith('$(') && key.endsWith(')')) {
          bindingRefKey = key.substr(2, key.length - 3)
        } else {
          bindingRefKey = key.substr(2)
        }
      }

      const parts = bindingRefKey.split('.')
      let ref: any = this.internalBindings

      if (parts.length > 1) {
        for (let i = 0; i < parts.length - 1; i++) {
          const part = parts[i]
          if (part === 'bindings' && i === 0) {
            continue
          }

          if (ref && ref[part]) {
            ref = ref[part]
          } else if (recursive) {
            ref[part] = {}
            ref = ref[part]
          }
        }
        if (ref) {
          this.$set(ref, parts[parts.length - 1], value)
        }
      } else {
        this.$set(ref, key, value)
      }

      this.$emit('input', this.getBindingValues())
    },
    getBindingValue (expression: string, args: Array<any>): any {
      let expressionBinding = expression
      if (!expression.startsWith('$')) {
        expressionBinding = '$(' + expression + ')'
      }
      return this.evalBinding(expressionBinding, this.getBindingValues(), args)
    },
    evalBinding (
      evalValue: any,
      bindings: { [key: string]: any} = {},
      args: Array<any> = []): any {
      if (typeof evalValue === 'string' && evalValue.startsWith('$')) {
        if (evalValue.startsWith('$(') && evalValue.endsWith(')')) {
          try {
            // eslint-disable-next-line no-eval
            return eval(evalValue.substr(2, evalValue.length - 3))
          } catch (error) {
            consoleError(error)
          }
        } else {
          return bindings[evalValue.substr(1)]
        }
      } else {
        return evalValue
      }
    },
    genComponentScopedSlots (desc: SchemaRendererComponent, index: number|null, argsBindings: Array<any> = []) {
      const scopedSlots: { [key: string]: ScopedSlot|undefined } = {}
      if (Array.isArray(desc.children) && desc.children.length > 0) {
        const scopedGroups: { [key: string]: SchemaRendererComponent[] } = {}
        desc.children
          .filter(this.getFilterFunction())
          .sort(this.getSortFunction())
          .forEach((c: SchemaRendererComponent) => {
            if (
              c.slotDetails !== undefined &&
              c.slotDetails !== null &&
              c.slotDetails !== 'default' &&
              typeof c.slotDetails === 'object') {
              const namedSlot = c.slotDetails as any
              if (namedSlot.scoped) {
                const slotName = namedSlot.slot.replace('<name>', namedSlot.name)
                if (!scopedGroups[slotName]) {
                  scopedGroups[slotName] = []
                }
                scopedGroups[slotName].push(c)
              }
            }
          })

        Object.entries(scopedGroups).forEach((entry: any[]) => {
          const slotName: string = entry[0]
          const slotRenderables: SchemaRendererComponent[] = entry[1]
          scopedSlots[slotName] = (...slotInputBindings: any) => {
            return slotRenderables.map((c: SchemaRendererComponent) => this.genComponent(c, slotInputBindings))
              .reduce((acc, val) => acc.concat(val), [])
          }
        })
      }
      return scopedSlots
    },
    getComponentModelPropertyName (desc: SchemaRendererComponent): string {
      if (desc['v-model-property-name']) {
        return desc['v-model-property-name']
      }

      const eventsMap: { [key: string]: string } = {
        VCheckbox: 'input-value',
      }

      if (desc.tag && eventsMap[desc.tag]) {
        return eventsMap[desc.tag]
      }

      return 'value'
    },
    getComponentModelEventName (desc: SchemaRendererComponent): string {
      if (desc['v-model-event']) {
        return desc['v-model-event']
      }

      const eventsMap: { [key: string]: string } = {
        VCheckbox: 'change',
      }

      if (desc.tag && eventsMap[desc.tag]) {
        return eventsMap[desc.tag]
      }

      return 'input'
    },
    evaluateComponentModel (
      props: { [key: string]: any },
      on: { [key: string]: any },
      desc: SchemaRendererComponent,
      index: number|null,
      argsBindings: Array<any> = []) {
      if (desc['v-model'] !== undefined) {
        const modelBinding: string = desc['v-model']
        const vModelEventName = this.getComponentModelEventName(desc)
        const vModelPropertyName = this.getComponentModelPropertyName(desc)
        const alreadyExistingEvents = on[vModelEventName]
        on[vModelEventName] = (val: any) => {
          this.setBindingValue(modelBinding, val, true)
          if (alreadyExistingEvents) {
            alreadyExistingEvents(val)
          }
        }
        props[vModelPropertyName] = this.getBindingValue(modelBinding, argsBindings)
      }
    },
    evaluateComponentPropsAndEvents (
      clone: SchemaRendererComponent,
      props: { [key: string]: any },
      on: { [key: string]: any },
      desc: SchemaRendererComponent,
      index: number|null,
      argsBindings: Array<any> = []) {
      // evaluate bindings
      Object.entries(clone).forEach((entry: any[]) => {
        const prop: string = entry[0]
        const propValue = entry[1]

        if (prop === 'on') {
          const AvailableEventsRefs: EventActionDetails[] = Object.entries(AvailableEvents).map((avE: any) => avE[1].default)
          Object.entries(propValue).forEach((eventEntry: any[]) => {
            const eventName = eventEntry[0]
            const events = eventEntry[1]

            if (Array.isArray(events)) {
              on[eventName] = (...args: any) => {
                events.forEach((event: EventActionType) => {
                  const action = AvailableEventsRefs.find((
                    avEvent: EventActionDetails) => (avEvent.name === event.action)
                  )
                  if (action != null) {
                    action.onFireAction(this, clone, event, args, argsBindings)
                  }
                })
              }
            } else if (typeof events === 'function') {
              on[eventName] = (...args: any) => {
                events(this, ...args)
              }
            }
          })
        } else if (prop === 'props') {
          Object.entries(propValue).forEach((propEntry: any[]) => {
            const propName = propEntry[0]
            const propItemValue = propEntry[1]
            props[propName] = this.evalBinding(propItemValue, this.getBindingValues(), argsBindings)
          })
        } else {
          clone[prop] = this.evalBinding(propValue, this.getBindingValues(), argsBindings)
        }
      })
    },
    genComponentPropsClone (desc: SchemaRendererComponent, index: number|null, argsBindings: Array<any> = []): SchemaRendererComponent {
      const clone: SchemaRendererComponent = cloneObjectWithParent(desc, null)

      if (desc.dontEvalBindings === true) {
        return clone
      }

      const on: {[key: string]: Function} = {}
      const props: {[key: string]: any} = {}

      this.evaluateComponentPropsAndEvents(clone, props, on, desc, index, argsBindings)
      this.evaluateComponentModel(props, on, desc, index, argsBindings)

      clone.on = on
      clone.props = props
      clone.scopedSlots = this.genComponentScopedSlots(desc, index, argsBindings)

      if (clone.hidden) {
        clone.show = false
      }

      return clone
    },
    genComponentTag (desc: SchemaRendererComponent): any {
      if (!desc.tag) {
        return 'div'
      } else {
        if (desc.tag === 'VSchemaRenderer') {
          return 'div'
        }

        // component has factory on its description
        if (desc.factory) {
          if (!this.asyncComponents[desc.tag]) {
            this.asyncComponents[desc.tag] = desc.factory
          }
          return this.asyncComponents[desc.tag]
        }

        // component has factory in components dictionary
        if (this.componentsDictionary[desc.tag]) {
          if (!this.asyncComponents[desc.tag]) {
            this.asyncComponents[desc.tag] = this.componentsDictionary[desc.tag]
          }
          return this.asyncComponents[desc.tag]
        }

        // component is global
        return desc.tag
      }
    },
    genComponentChildren (desc: SchemaRendererComponent, argsBindings: any = null): VNode[] {
      const children: any[] = []

      if (desc.children) {
        if (typeof desc.children === 'string') {
          children.push(desc.children)
        } else if (Array.isArray(desc.children) && desc.children.length > 0) {
          desc.children
            .filter(this.getFilterFunction())
            .sort(this.getSortFunction())
            .forEach(c => {
              if (!c.slotDetails || c.slotDetails === 'default') {
                children.push(...this.genComponent(c, argsBindings))
              } else if (typeof c.slotDetails === 'object') {
                const detailedSlot: any = c.slotDetails
                if (!detailedSlot.scoped) {
                  children.push(this.$createElement('template', { slot: detailedSlot.slot }, this.genComponent(c, argsBindings)))
                }
              }
            })
        }
      }

      return children
    },
    genComponent (desc: SchemaRendererComponent, argsBindings: Array<any> = []): VNode[] {
      let cloned: VNode[] = []

      if (desc['v-for']) {
        const vfor = this.evalBinding(desc['v-for'], this.getBindingValues(), argsBindings)
        if (vfor && Array.isArray(vfor)) {
          vfor.forEach((vforBind: any, index: number) => {
            const vforArgsBindings = [vforBind, ...argsBindings]
            const cloneProps = this.genComponentPropsClone(desc, index, vforArgsBindings)
            const rootTag = this.genComponentTag(desc)
            cloned.push(this.$createElement(rootTag, cloneProps, this.genComponentChildren(desc, vforArgsBindings)))
          })
        }
      } else {
        const cloneProps = this.genComponentPropsClone(desc, null, argsBindings)
        const rootTag = this.genComponentTag(desc)
        const clone = this.$createElement(rootTag, cloneProps, this.genComponentChildren(desc, argsBindings))
        cloned.push(clone)
      }

      if (desc.wrap) {
        cloned = [this.$createElement(
          desc.wrap,
          {
            staticClass: desc.wrapClass ?? '',
            attrs: (desc.wrapAttributes ?? {}),
          },
          cloned
        )]
      }

      if (this.editorMode) {
        return [this.genEditableComponent(desc, cloned)]
      }

      return cloned
    },
    genRootComponent (): VNode {
      const rootTag = this.genComponentTag(this)
      const clone = this.$createElement(rootTag, {
        attrs: this.attributes,
      }, this.genComponentChildren(this, []))

      if (this.wrap) {
        return this.$createElement(
          this.wrap,
          {
            staticClass: this.wrapClass ?? '',
            attrs: (this.wrapAttributes ?? {}),
          },
          [clone]
        )
      }

      return clone
    },
    genEditableComponent (desc: SchemaRendererComponent, cloned: VNode[]): VNode {
      return this.$createElement(
        'section',
        {
          staticStyle: {
            display: 'contents',
          },
          on: {
            mouseover: () => {
              if (desc.id) {
                this.editableItems[desc.id] = true
                this.$forceUpdate()
              }
            },
            mouseleave: () => {
              if (desc.id) {
                this.editableItems[desc.id] = false
                this.$forceUpdate()
              }
            },
          },
        },
        [
          this.$createElement(
            VSchemaBuilderAppend,
            {
              staticStyle: {
                position: 'absolute',
                'z-index': 1,
                display: desc.id && this.editableItems[desc.id] ? 'inline !important' : 'none !important',
              },
              props: {
                item: desc,
              },
              on: {
                'move-first': (item: SchemaRendererComponent) => {
                  this.$emit('move-first', item)
                },
                'move-last': (item: SchemaRendererComponent) => {
                  this.$emit('move-last', item)
                },
                'move-up': (item: SchemaRendererComponent) => {
                  this.$emit('move-up', item)
                },
                'move-down': (item: SchemaRendererComponent) => {
                  this.$emit('move-down', item)
                },
                'change-props': (item: SchemaRendererComponent, props: {[key: string]: any}) => {
                  this.$emit('change-props', item, props)
                },
                'change-attributes': (item: SchemaRendererComponent, attributes: {[key: string]: any}) => {
                  this.$emit('change-attributes', item, attributes)
                },
                'change-events': (item: SchemaRendererComponent, events: {[key: string]: any}) => {
                  this.$emit('change-events', item, events)
                },
                'change-slots': (item: SchemaRendererComponent, slots: { [key: string]: any }) => {
                  this.$emit('change-slots', item, slots)
                },
                'add-child': (item: SchemaRendererComponent, tags: Array<string>) => {
                  this.$emit('add-child', item, tags)
                },
                'remove-item': (item: SchemaRendererComponent) => {
                  this.$emit('move-first', item)
                },
              },
            }
          ),
          ...cloned,
        ]
      )
    },
    getSortFunction () {
      return (a: any, b: any) => a.priority - b.priority
    },
    getFilterFunction () {
      return (f: any) => f.hidden !== true
    },
  },
  render (h): VNode {
    return this.genRootComponent()
  },
})
