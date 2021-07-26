import { TagAttribute } from 'types/services/schemas'

export const VSchemaBuilderStandardTagAttributes: TagAttribute[] = [
  {
    name: 'v-for',
    description: 'Iterate this binding value and create components of this type. use $() expression',
    default: '',
    value: {
      kind: 'expression',
      type: 'string',
    },
    cantBind: true,
    autoBind: true,
  },
  {
    name: 'v-model',
    description: 'Automatically update changes from this component to a binding with an expression. use $() expression',
    default: false,
    value: {
      kind: 'expression',
      type: 'string',
    },
    cantBind: true,
    autoBind: true,
  },
  {
    name: 'v-model-event',
    description: 'Event name used as automatic update for component model. default event is "input".',
    default: false,
    value: {
      kind: 'expression',
      type: 'string',
    },
    cantBind: true,
    autoBind: true,
  },
  {
    name: 'v-model-property-name',
    description: 'Property used for sending v-model value to the component. default property name is "value".',
    default: false,
    value: {
      kind: 'expression',
      type: 'string',
    },
    cantBind: true,
    autoBind: true,
  },
  {
    name: 'dontEvalBindings',
    description: 'Do not automatically evaluate bindings for this component',
    default: false,
    value: {
      kind: 'expression',
      type: 'boolean',
    },
    cantBind: true,
    autoBind: true,
  },
  {
    name: 'priority',
    description: 'Sets this components pririty on parent rendering order',
    default: 0,
    value: {
      kind: 'expression',
      type: 'number',
    },
    cantBind: true,
  },
  {
    name: 'attributes',
    description: 'Sets other attribute customizations on this component',
    default: {},
    value: {
      kind: 'expression',
      type: 'object',
    },
    cantBind: true,
  },
  {
    name: 'staticClass',
    description: 'Sets the static class on the DOM component',
    default: "''",
    value: {
      kind: 'expression',
      type: 'string',
    },
  },
  {
    name: 'hidden',
    description: 'Sets this component to be hidden',
    default: false,
    value: {
      kind: 'expression',
      type: 'boolean',
    },
  },
  {
    name: 'wrap',
    description: 'Wrap this component with another one',
    default: 'undefined',
    value: {
      kind: 'expression',
      type: 'string',
    },
  },
  {
    name: 'wrapClass',
    description: 'Set the wrapping components static class',
    default: 'undefined',
    value: {
      kind: 'expression',
      type: 'string',
    },
  },
  {
    name: 'wrapAttributes',
    description: 'Set customized attributes for the wrapping component',
    default: {},
    value: {
      kind: 'expression',
      type: 'object',
    },
    cantBind: true,
  },
]
