import { SchemaRendererAgent, SchemaRendererComponent, EventActionDetails, EventActionType } from 'types/services/schemas'
import { VNode } from 'vue/types/umd'
import ChangeBinding from './ChangeBinding'

export default <EventActionDetails>{
  name: 'change_binding',
  text: 'Change binding value',

  genDetailsDialog (h: Function, item: SchemaRendererComponent, event: EventActionType, onChange: Function): VNode {
    return h(
      ChangeBinding,
      {
        props: {
          item,
          event,
        },
        on: {
          change: onChange,
        },
      }
    )
  },

  onFireAction (
    renderer: SchemaRendererAgent,
    item: SchemaRendererComponent,
    event: EventActionType,
    eventArgs: any[],
    argsBindings: Array<any>
  ): void {
    if (['json', 'number', 'boolean'].includes(event.details.type)) {
      const val = JSON.parse(event.details.value)
      renderer.setBindingValue(event.details.binding, val, event.details.recursive)
    } else if (event.details.type === 'null') {
      renderer.setBindingValue(event.details.binding, null, event.details.recursive)
    } else if (event.details.type === 'undefined') {
      renderer.setBindingValue(event.details.binding, undefined, event.details.recursive)
    } else {
      if (event.details.value?.startsWith('$')) {
        renderer.setBindingValue(
          event.details.binding,
          renderer.getBindingValue(event.details.value, argsBindings),
          event.details.recursive
        )
      } else {
        renderer.setBindingValue(event.details.binding, event.details.value, event.details.recursive)
      }
    }
  },
}
