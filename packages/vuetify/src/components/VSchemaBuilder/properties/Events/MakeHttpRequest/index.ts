import { SchemaRendererComponent, EventActionType, EventActionDetails } from 'types/services/schemas'
import { VNode } from 'vue/types/umd'

export default <EventActionDetails>{
  name: 'make_http_request',
  text: 'Make Http Request',

  genDetailsDialog (h: Function, item: SchemaRendererComponent, event: EventActionType, onChange: Function): VNode {
    return h()
  },
}
