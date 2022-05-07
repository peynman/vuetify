import { SchemaRendererAgent, SchemaRendererComponent, EventActionDetails, EventActionType } from 'types/services/schemas'
import { VNode } from 'vue/types/umd'
import EvalExpression from './EvalExpression'
import { consoleError, consoleWarn } from '../../../../../util/console'

export default <EventActionDetails>{
  name: 'eval_expression',
  text: 'Evaluate JS expression (eval)',

  genDetailsDialog (h: Function, item: SchemaRendererComponent, event: EventActionType, onChange: Function): VNode {
    return h(
      EvalExpression,
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
    try {
      // eslint-disable-next-line no-eval
      eval(event.details?.expression)
    } catch (e: any) {
      consoleWarn('Error on eval for item event')
      consoleError(e)
    }
  },
}
