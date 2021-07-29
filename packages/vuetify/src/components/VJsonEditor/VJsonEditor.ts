import { VNode, PropType } from 'vue'
import mixins, { ExtractVue } from '../../util/mixins'

import VIcon from '../VIcon'
import VBtn from '../VBtn'
import VChip from '../VChip'
import VTextField from '../VTextField'
import VLabel from '../VLabel'
import { VSpacer, VCol } from '../VGrid'
import { VToolbar } from '../VToolbar'
import { VTreeview } from '../VTreeview'
import { VSelect } from '../VSelect'
import { VDivider } from '../VDivider'

import EasyInteracts from '../../mixins/easyinteracts'
import { consoleError } from '../../util/console'

const baseMixins = mixins(
  EasyInteracts
  /* @vue/component */
)
interface options extends ExtractVue<typeof baseMixins> {
  $el: HTMLElement
}

export default baseMixins.extend<options>().extend({
  name: 'v-json-editor',

  inheritAttrs: false,

  props: {
    value: null as any as PropType<string|object>,
    startMode: {
      type: String,
      default: 'editor',
    },
    startType: {
      type: String,
      default: 'array',
    },
    canChangeRootType: {
      type: Boolean,
      default: true,
    },
    label: {
      type: String,
      default: '',
    },
  },

  data () {
    let objectSchema: any = this.startType === 'array' ? [] : {}
    if (this.value) {
      if (typeof this.value === 'string') {
        try {
          objectSchema = JSON.parse(this.value)
        } catch (error) {
          consoleError(error)
        }
      } else {
        objectSchema = this.value
      }
    }
    return {
      objectSchema,
      mode: this.startMode === null ? 'editor' : this.startMode,
      add_type: null as any,
      add_name: null as any,
      add_value: null as any,
    }
  },

  methods: {
    getTreeViewItemsFromSchema (schema: any) {
      const treeview: any[] = []

      if (Array.isArray(schema)) {
        schema.forEach((item: any, indexer: number) => {
          let type = 'null'
          let value = null
          if (Array.isArray(item)) {
            type = 'array'
          } else if (typeof item === 'object') {
            type = 'object'
          } else if (typeof item === 'number') {
            type = 'number'
            value = item
          } else if (typeof item === 'string') {
            type = 'string'
            value = item
          } else if (typeof item === 'boolean') {
            type = 'bool'
            value = item
          }
          treeview.push({
            ref: item,
            parentRef: schema,
            parentType: 'array',
            label: indexer,
            type,
            value,
            children: item !== null ? this.getTreeViewItemsFromSchema(item) : [],
          })
        })
      } else if (typeof schema === 'object') {
        Object.entries(schema).forEach((entry: any[]) => {
          const item = entry[1]
          let type = 'null'
          let value = null
          if (Array.isArray(item)) {
            type = 'array'
          } else if (typeof item === 'object') {
            type = 'object'
          } else if (typeof item === 'number') {
            type = 'number'
            value = item
          } else if (typeof item === 'string') {
            type = 'string'
            value = item
          } else if (typeof item === 'boolean') {
            type = 'bool'
            value = item
          }
          treeview.push({
            ref: item,
            parentRef: schema,
            parentType: 'object',
            label: entry[0],
            type,
            value,
            children: item !== null ? this.getTreeViewItemsFromSchema(item) : [],
          })
        })
      }

      return treeview
    },
    onDownload () {
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(this.objectSchema, null, 2))
      const downloadAnchorNode = document.createElement('a')
      downloadAnchorNode.setAttribute('href', dataStr)
      downloadAnchorNode.setAttribute('download', 'schema.json')
      document.body.appendChild(downloadAnchorNode) // required for firefox
      downloadAnchorNode.click()
      downloadAnchorNode.remove()
    },
    onUpload () {
      const downloadAnchorNode = document.createElement('input')
      downloadAnchorNode.setAttribute('type', 'file')
      document.body.appendChild(downloadAnchorNode) // required for firefox
      downloadAnchorNode.click()
      downloadAnchorNode.addEventListener(
        'change',
        (event: Event) => {
          const fileToRead = event.target as HTMLInputElement
          if (fileToRead) {
            const files = fileToRead.files
            if (files && files.length) {
              const file = files[0]
              const reader = new FileReader()
              reader.onload = (e: any) => {
                try {
                  const fileHandler = e.target
                  this.objectSchema = JSON.parse(fileHandler.result)
                  this.$emit('change', this.objectSchema)
                } catch (e) {
                  consoleError(e)
                }
              }
              reader.readAsText(file)
            }
          }
        },
        false
      )
      downloadAnchorNode.remove()
    },
    genRoot (): VNode {
      const children = [
        this.genToolbar(),
      ]

      if (this.mode === 'editor') {
        children.push(this.genTreeEditor())
      }
      if (this.mode === 'code') {
        children.push(this.genCodeView())
      }
      return this.$createElement('div', {
        staticClass: 'd-flex flex-column flex-grow-1',
      }, children)
    },
    genNewItemMenu (parent: any): VNode {
      const properties: VNode[] = []

      if (!Array.isArray(parent)) {
        properties.push(
          this.$createElement(
            VTextField,
            {
              props: {
                label: 'Item key',
                'hide-details': true,
              },
              on: {
                change: (e: any) => {
                  this.add_name = e
                },
              },
            }
          )
        )
      }

      properties.push(
        this.$createElement(
          VSelect,
          {
            props: {
              items: [
                {
                  text: 'String',
                  value: 'string',
                },
                {
                  text: 'Number',
                  value: 'number',
                },
                {
                  text: 'Boolean',
                  value: 'bool',
                },
                {
                  text: 'Array',
                  value: 'array',
                },
                {
                  text: 'Object',
                  value: 'object',
                },
                {
                  text: 'Null',
                  value: 'null',
                },
              ],
              label: 'Item type',
              'hide-details': true,
            },
            on: {
              change: (e: any) => {
                this.add_type = e
              },
            },
          },
        )
      )

      if (!['object', 'array', 'null'].includes(this.add_type)) {
        if (this.add_type === 'bool') {
          properties.push(
            this.$createElement(
              VSelect,
              {
                props: {
                  items: [
                    {
                      text: 'True',
                      value: 'true',
                    },
                    {
                      text: 'False',
                      value: 'false',
                    },
                  ],
                  'hide-details': true,
                  label: 'Item value',
                },
                on: {
                  change: (e: any) => {
                    this.add_value = e
                  },
                },
              },
            )
          )
        } else {
          properties.push(
            this.$createElement(
              VTextField,
              {
                props: {
                  'hide-details': true,
                  label: 'Item value',
                },
                on: {
                  change: (e: any) => {
                    this.add_value = e
                  },
                },
              }
            )
          )
        }
      }

      return this.$createElement(
        VCol,
        {
        },
        [
          ...properties,
          this.$createElement(
            VBtn,
            {
              staticClass: 'mt-3',
              props: {
                color: 'success',
                block: true,
              },
              on: {
                click: () => {
                  if (this.add_type !== null && (Array.isArray(parent) || this.add_name !== null)) {
                    let value: any = null
                    if (this.add_type === 'object') {
                      value = {}
                    } else if (this.add_type === 'array') {
                      value = []
                    } else if (this.add_type === 'bool') {
                      value = this.add_value === 'true'
                    } else if (this.add_type === 'null') {
                      value = null
                    } else {
                      value = this.add_value
                    }
                    if (Array.isArray(parent)) {
                      parent.push(value)
                      this.$emit('change', this.objectSchema)
                    } else {
                      this.$set(parent, this.add_name, value)
                      this.$emit('change', this.objectSchema)
                    }
                  }
                },
              },
            },
            'Add Item'
          ),
        ]
      )
    },
    genToolbar (): VNode {
      const toolbarItems: VNode[] = []

      if (this.mode === 'editor') {
        toolbarItems.push(
          this.genMenu(
            'mdi-plus-circle',
            'green',
            'Add new item to root',
            [this.genNewItemMenu(this.objectSchema)],
            null,
            {
              'close-on-content-click': false,
            },
            {
              'x-small': false,
              iconProps: {
                'x-small': false,
              },
            }
          )
        )
        toolbarItems.push(
          this.$createElement(
            VSelect,
            {
              staticStyle: {
                'max-width': '150px',
              },
              props: {
                dense: true,
                'hide-details': true,
                solo: true,
                rounded: true,
                disabled: !this.canChangeRootType,
                items: [
                  {
                    text: 'Array',
                    value: 'array',
                  },
                  {
                    text: 'Object',
                    value: 'object',
                  },
                ],
                value: Array.isArray(this.objectSchema) ? 'array' : 'object',
              },
              on: {
                change: (e: any) => {
                  if (e === 'object') {
                    this.objectSchema = {}
                  } else {
                    this.objectSchema = []
                  }
                },
              },
            }
          )
        )
      }

      return this.$createElement(VToolbar,
        {
          staticClass: '',
          props: {
            flat: true,
            dense: true,
            dark: this.mode !== 'editor',
          },
        },
        [
          this.genToolbarButton(this.mode === 'code' ? 'mdi-close' : 'mdi-code-array', {
            color: this.mode === 'code' ? 'warning' : 'secondary',
          }, () => {
            this.mode = this.mode === 'editor' ? 'code' : 'editor'
          }),
          this.$createElement(
            VLabel,
            {
              props: {
                dark: this.mode !== 'code',
              },
              on: {
                click: () => {
                  this.mode = 'code'
                },
              },
            },
            this.label
          ),
          this.$createElement(
            VSpacer
          ),
          ...toolbarItems,
          this.$createElement(
            VDivider,
            {
              staticClass: 'ms-1',
              props: {
                vertical: true,
                inset: true,
              },
            },
          ),
          this.genMenu(
            'mdi-refresh',
            'red',
            'Reset SchemaBuilder Tree',
            this.genRemoveItemMenuContent(() => {
              this.objectSchema = []
            }),
            null,
            {},
            {
              'x-small': false,
              small: true,
              iconProps: {
                'x-small': false,
                small: true,
              },
            }
          ),
          this.$createElement(
            VDivider,
            {
              props: {
                vertical: true,
                inset: true,
              },
            },
          ),
          this.genToolbarButton('mdi-download', {
            color: 'secondary',
          }, this.onDownload),
          this.genToolbarButton('mdi-upload', {
            color: 'secondary',
          }, this.onUpload),
        ]
      )
    },
    genToolbarButton (icon: string, props: {}, click: Function): VNode {
      return this.$createElement(VBtn, {
        props: {
          icon: true,
          small: true,
          ...props,
        },
        on: {
          click: () => {
            click()
          },
        },
      }, [
        this.$createElement(VIcon, {
          props: {
            small: true,
          },
        }, icon),
      ])
    },
    genCodeView (): VNode {
      return this.$createElement(
        'pre',
        {},
        JSON.stringify(this.objectSchema, null, 2),
      )
    },
    genTreeEditor (): VNode {
      return this.$createElement(
        VTreeview,
        {
          props: {
            rounded: true,
            hoverable: true,
            items: this.getTreeViewItemsFromSchema(this.objectSchema),
            dense: true,
            'multiple-active': true,
            'open-all': true,
            'item-key': 'id',
            'return-object': true,
          },
          scopedSlots: {
            label: e => {
              const properties: VNode[] = []
              if (e.item.parentType === 'array') {
                properties.push(
                  this.$createElement(
                    VChip,
                    {
                      props: {
                        dense: true,
                      },
                    },
                    [
                      e.item.label.toString(),
                    ]
                  )
                )
              } else {
                properties.push(
                  this.$createElement(
                    VTextField,
                    {
                      props: {
                        solo: true,
                        rounded: true,
                        outlined: true,
                        dense: true,
                        flat: true,
                        label: 'Item name',
                        'hide-details': true,
                        value: e.item.label,
                      },
                    }
                  )
                )
                properties.push(
                  this.$createElement(
                    VChip,
                    {
                      staticClass: 'mx-1',
                      props: {
                        dense: true,
                      },
                    },
                    ':'
                  )
                )
              }

              if (['bool', 'number', 'string'].includes(e.item.type)) {
                properties.push(
                  this.$createElement(
                    VTextField,
                    {
                      props: {
                        solo: true,
                        outlined: true,
                        rounded: true,
                        flat: true,
                        dense: true,
                        label: 'Item value',
                        'hide-details': true,
                        value: e.item.value,
                      },
                    }
                  )
                )
              } else {
                properties.push(
                  this.$createElement(
                    VChip,
                    {
                      props: {
                        dense: true,
                      },
                    },
                    [
                      e.item.type === 'array' ? 'Array (' + e.item.children.length + ')' : (e.item.type === 'object' && e.item.children?.length > 0 ? 'Object' : 'Null'),
                    ]
                  )
                )
              }

              properties.push(
                this.$createElement(
                  VSpacer
                )
              )

              if (['array', 'object'].includes(e.item.type)) {
                properties.push(
                  this.genMenu(
                    'mdi-plus-circle',
                    'green',
                    'Add new item',
                    [this.genNewItemMenu(e.item.ref)],
                    null,
                    {
                      'close-on-content-click': false,
                    },
                    {
                      'x-small': false,
                      iconProps: {
                        'x-small': false,
                      },
                    },
                  )
                )
              }

              properties.push(
                this.genMenu(
                  'mdi-delete',
                  'red',
                  'Remove item',
                  this.genRemoveItemMenuContent(() => {
                    if (e.item.parentType === 'array') {
                      e.item.parentRef.splice(e.item.parentRef.indexOf(e.item.ref), 1)
                      this.$emit('change', this.objectSchema)
                    } else {
                      this.$set(e.item.parentRef, e.item.label, undefined)
                      this.$emit('change', this.objectSchema)
                      this.$forceUpdate()
                    }
                  }),
                  null,
                  {},
                  {
                    'x-small': false,
                    iconProps: {
                      'x-small': false,
                    },
                  },
                )
              )
              return this.$createElement(
                'div',
                {
                  staticClass: 'd-flex flex-row justify-start align-center my-1',
                },
                properties
              )
            },
            append: e => {
              return null
            },
          },
        }
      )
    },
  },

  render (h): VNode {
    return this.genRoot()
  },
})
