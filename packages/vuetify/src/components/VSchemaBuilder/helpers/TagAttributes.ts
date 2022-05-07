import { TagAttribute } from 'types/services/schemas'

export const VSchemaBuilderStandardTagAttributes: TagAttribute[] = [
  {
    name: 'ref',
    description: 'ref name to be used to access this component from renderer callbacks as renderer.$refs.[ref]',
    default: '',
    value: {
      kind: 'expression',
      type: 'string',
    },
    cantBind: true,
    autoBind: true,
  },
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
    name: 'hide-xl',
    description: 'Should component be hidden on extra large and greater breakpoints.',
    default: false,
    value: {
      kind: 'expression',
      type: 'boolean',
    },
    cantBind: true,
  },
  {
    name: 'hide-lg',
    description: 'Should component be hidden on extra large breakpoints.',
    default: false,
    value: {
      kind: 'expression',
      type: 'boolean',
    },
    cantBind: true,
  },
  {
    name: 'hide-md',
    description: 'Should component be hidden on medium breakpoints.',
    default: false,
    value: {
      kind: 'expression',
      type: 'boolean',
    },
    cantBind: true,
  },
  {
    name: 'hide-sm',
    description: 'Should component be hidden on small breakpoints.',
    default: false,
    value: {
      kind: 'expression',
      type: 'boolean',
    },
    cantBind: true,
  },
  {
    name: 'hide-xs',
    description: 'Should component be hidden on extra small breakpoints.',
    default: false,
    value: {
      kind: 'expression',
      type: 'boolean',
    },
    cantBind: true,
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
    name: 'staticClass',
    description: 'Sets the static class on the DOM component',
    default: "''",
    value: {
      kind: 'expression',
      type: 'string',
    },
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
    name: 'style',
    description: 'Sets styles on this component',
    default: {},
    value: {
      kind: 'expression',
      type: 'object',
    },
    cantBind: true,
  },
  {
    name: 'contentBeforeChildren',
    description: 'Set a content string, before rendering other children',
    default: 'undefined',
    value: {
      kind: 'expression',
      type: 'string',
    },
  },
  {
    name: 'contentAfterChildren',
    description: 'Set a content string, after children rendering',
    default: 'undefined',
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
