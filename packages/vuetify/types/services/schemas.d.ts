import { Component } from 'vue';
import { AsyncComponentFactory } from 'vue/types/options';
import { VNodeData, VNode } from 'vue/types/umd'

export interface SchemaRendererComponent extends VNodeData {
  [key: string]: any
  id?: string
  hidden?: boolean
  wrap?: string
  wrapClass?: string
  wrapStyle?: object
  wrapAttributes?: object
  children?: string | SchemaRendererComponent[]
  slotDetails?: string | Object
  priority?: number
  parent?: SchemaRendererComponent|null
  default?: any
  dontEvalBindings?: boolean
  'v-for'?: string
  'v-model'?: string
  'v-model-property-name'?: string
  'v-model-event'?: string
  factory?: AsyncComponentFactory
}

export type SchemaRendererBindingPromise = (r: SchemaRendererAgent) => Promise<any>

export interface SchemaRendererBinding {
  name: string
  type: string
  default: any
}

export interface SchemaRendererAgent {
  setBindingValue(key: string, value: any, recursive: boolean): void
  getBindingValue(expression: string, args: Array<any>): any
  getBindingValues(): { [key: string]: any }
  resetBindingValues(): void
}

export interface TagEventArgument {
  name?: string
  type?: string
}

export interface TagEvent {
  name: string
  description?: string
  arguments?: TagEventArgument[]
}

export interface TagAttributeValue {
  kind?: string
  type?: string | string[]
}

export interface TagAttribute {
  name: string
  description?: string
  default?: any
  value?: TagAttributeValue
  cantBind?: boolean
  autoBind?: boolean
  factory?: AsyncComponentFactory
  tag?: string
}

export interface TagSlotProperties {
  name: string
  type?: string
}

export interface TagSlot {
  name: string
  description?: string
  vueProperties?: TagSlotProperties[]
}

export interface TagSettings {
  name: string
  description?: string
  attributes?: TagAttribute[]
  events?: TagEvent[]
  slots?: TagSlot[]
}

export interface SelectableItem {
  name: string
  text: string
}

export interface EventActionType {
  uid: string
  action: string
  event: TagEvent
  details: { [key: string]: any }

  genDetailsDialog (h: Function, item: SchemaRendererComponent, event: EventActionType, onChange: Function): VNode
}

export interface EventActionDetails {
  name: string
  text: string

  genDetailsDialog (h: Function, item: SchemaRendererComponent, event: EventActionType, onChange: Function): VNode
  onFireAction (
    renderer: SchemaRendererAgent,
    item: SchemaRendererComponent,
    event: EventActionType,
    eventArgs: any[],
    argsBindings: Array<any>
  ): void
}
