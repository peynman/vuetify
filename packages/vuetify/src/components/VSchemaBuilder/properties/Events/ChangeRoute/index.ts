import { SchemaRendererComponent, EventActionType, EventActionDetails } from 'types/services/schemas'
import { VNode } from 'vue/types/umd'

export default <EventActionDetails>{
  name: 'change_route',
  text: 'Change route',

  genDetailsDialog (h: Function, item: SchemaRendererComponent, event: EventActionType, onChange: Function): VNode {
    return h()
  },
}
