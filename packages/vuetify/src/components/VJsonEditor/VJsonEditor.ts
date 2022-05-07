import { VNode, PropType } from 'vue'
import mixins, { ExtractVue } from '../../util/mixins'
import EasyInteracts from '../../mixins/easyinteracts'
import { consoleError } from '../../util/console'

import VIcon from '../VIcon/VIcon'
import VBtn from '../VBtn/VBtn'
import VChip from '../VChip/VChip'
import VTextField from '../VTextField/VTextField'
import VSimpleCheckbox from '../VCheckbox/VSimpleCheckbox'
import VSpacer from '../VGrid/VSpacer'
import VToolbar from '../VToolbar/VToolbar'
import VTreeview from '../VTreeview/VTreeview'
import VSelect from '../VSelect/VSelect'
import VDivider from '../VDivider/VDivider'
import VLabel from '../VLabel/VLabel'
import { VList, VListItemContent, VListItemTitle, VListItem } from '../VList'
import { makeRandomId } from '../../util/helpers'

const baseMixins = mixins(
  EasyInteracts
  /* @vue/component */
)
interface options extends ExtractVue<typeof baseMixins> {
  $el: HTMLElement
}

export interface ItemType {
  text: string
  value: string
  genNewItem (values: { [key: string]: any }): any
}

export interface ItemTreeviewType {
  ref: any
  parentRef?: any
  parentType?: string
  label: string|number
  type: string
  value: any
  dirty?: string
  children?: ItemTreeviewType[]
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
    readonly: Boolean,
    smallIcons: Boolean,
    xSmallIcons: Boolean,
    extraTypes: null as any as PropType<Array<ItemType>|null>,
    hideDefaultTypes: Boolean,
  },

  data () {
    let internalValue: any = this.startType === 'array' ? [] : {}
    if (this.value) {
      if (typeof this.value === 'string') {
        try {
          internalValue = JSON.parse(this.value)
        } catch (error: any) {
          consoleError(error)
        }
      } else {
        internalValue = this.value
      }
    }
    return {
      internalValue,
      mode: this.startMode === null ? 'editor' : this.startMode,
    }
  },

  computed: {
    availableItemTypes (): ItemType[] {
      const types: ItemType[] = this.hideDefaultTypes ? [] : [
        {
          text: 'String',
          value: 'string',
          genNewItem (vals: { [key: string]: any }): any {
            return vals.str || ''
          },
        },
        {
          text: 'Number',
          value: 'number',
          genNewItem (vals: { [key: string]: any }): any {
            return vals.num || 1
          },
        },
        {
          text: 'Boolean',
          value: 'bool',
          genNewItem (vals: { [key: string]: any }): any {
            return vals.checked || true
          },
        },
        {
          text: 'Array',
          value: 'array',
          genNewItem (vals: { [key: string]: any }): any {
            return []
          },
        },
        {
          text: 'Object',
          value: 'object',
          genNewItem (vals: { [key: string]: any }): any {
            return {}
          },
        },
        {
          text: 'Null',
          value: 'null',
          genNewItem (vals: { [key: string]: any }): any {
            return null
          },
        },
      ]

      if (this.extraTypes) {
        types.push(...this.extraTypes)
      }

      return types
    },
    treeViewItems (): ItemTreeviewType[] {
      return this.getTreeViewItemsFromSchema(this.internalValue)
    },
  },

  watch: {
    value () {
      if (this.value) {
        if (typeof this.value === 'string') {
          try {
            this.internalValue = JSON.parse(this.value)
          } catch (error: any) {
            consoleError(error)
          }
        } else {
          this.internalValue = this.value
        }
      }
    },
  },

  methods: {
    getTreeViewItemsFromSchema (schema: any): ItemTreeviewType[] {
      const treeview: ItemTreeviewType[] = []

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
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(this.internalValue, null, 2))
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
                  this.internalValue = JSON.parse(fileHandler.result)
                  this.$emit('input', this.internalValue)
                } catch (e: any) {
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
    genAvailableItemTypesList (parent: any): VNode[] {
      return [this.$createElement(
        VList,
        {
        },
        this.availableItemTypes.map((t: ItemType) => {
          return this.$createElement(
            VListItem,
            {
              on: {
                click: (e: any) => {
                  const value = t.genNewItem(this.internalValue)
                  if (Array.isArray(parent)) {
                    parent.push(value)
                    this.emitChanges()
                  } else {
                    this.$set(parent, makeRandomId(5), value)
                    this.emitChanges()
                  }
                },
              },
            },
            [
              this.$createElement(VListItemContent, {}, [this.$createElement(VListItemTitle, {}, t.text)]),
            ]
          )
        })
      )]
    },
    genToolbar (): VNode {
      const toolbarItems: VNode[] = []

      if (this.mode === 'editor' && !this.readonly) {
        toolbarItems.push(
          this.genMenu(
            'mdi-plus-circle',
            'green',
            this.$vuetify.lang.t('$vuetify.jsonEditor.addTitle'),
            [this.genAvailableItemTypesList(this.internalValue)],
            null,
            {
              'close-on-content-click': false,
            },
            {
              small: this.smallIcons,
              'x-small': this.xSmallIcons,
              iconProps: {
                small: this.smallIcons,
                'x-small': this.xSmallIcons,
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
                flat: true,
                rounded: false,
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
                value: Array.isArray(this.internalValue) ? 'array' : 'object',
              },
              on: {
                change: (e: any) => {
                  if (e === 'object') {
                    this.internalValue = {}
                  } else {
                    this.internalValue = []
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
          ...toolbarItems,
          this.$createElement(
            VLabel,
            {
              props: {
                dark: this.mode === 'code',
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
              this.internalValue = []
            }),
            null,
            {
            },
            {
              'x-small': false,
              small: true,
              disabled: this.readonly,
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
            disabled: this.readonly,
          }, this.onDownload),
          this.genToolbarButton('mdi-upload', {
            color: 'secondary',
            disabled: this.readonly,
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
        JSON.stringify(this.internalValue, null, 2),
      )
    },
    genTreeEditor (): VNode {
      return this.$createElement(
        VTreeview,
        {
          props: {
            rounded: false,
            hoverable: true,
            items: this.treeViewItems,
            dense: true,
            'multiple-active': true,
            'open-all': true,
            'item-key': 'id',
            'return-object': true,
          },
          scopedSlots: {
            label: e => {
              return this.genTreeEditorItemLabel(e.item)
            },
            append: e => {
              return this.genTreeEditorItemAppend(e.item)
            },
          },
        }
      )
    },
    genTreeEditorItemAppend (item: ItemTreeviewType): VNode {
      const properties: VNode[] = []
      if (['array', 'object'].includes(item.type) && !this.readonly) {
        properties.push(
          this.genMenu(
            'mdi-plus-circle',
            'green',
            'Add new item',
            [this.genAvailableItemTypesList(item.ref)],
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

      if (!this.readonly) {
        properties.push(
          this.genMenu(
            'mdi-delete',
            'red',
            'Remove item',
            this.genRemoveItemMenuContent(() => {
              if (item.parentType === 'array') {
                item.parentRef.splice(item.parentRef.indexOf(item.ref), 1)
                this.$emit('input', this.internalValue)
              } else {
                this.$set(item.parentRef, item.label, undefined)
                delete item.parentRef[item.label]
                this.$emit('input', this.internalValue)
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
      }

      return this.$createElement(
        'div',
        {
          staticClass: 'd-flex flex-row justify-start align-center my-1',
        },
        properties
      )
    },
    genTreeEditorItemLabel (item: ItemTreeviewType): VNode {
      const properties: VNode[] = []
      if (item.parentType === 'array') {
        properties.push(
          this.$createElement(
            VChip,
            {
              staticClass: 'pa-1 px-2 me-1',
              props: {
                dense: true,
                label: true,
              },
            },
            [
              '#' + item.label.toString(),
            ]
          )
        )
      } else {
        const updateItemLabelEvent = (item: ItemTreeviewType) => {
          this.$set(item.parentRef, item.label, undefined)
          delete item.parentRef[item.label]
          this.$set(item, 'label', item.dirty)
          this.$set(item.parentRef, item.label, item.value)
          this.$set(item, 'dirty', undefined)
          this.emitChanges()
        }
        properties.push(
          this.$createElement(
            VTextField,
            {
              props: {
                solo: true,
                rounded: false,
                outlined: true,
                dense: true,
                flat: true,
                label: 'Item name',
                'hide-details': true,
                value: item.label,
                readonly: this.readonly,
              },
              on: {
                input: (newLabel: any) => {
                  this.$set(item, 'dirty', newLabel)
                },
                keydown: (keyEv: KeyboardEvent) => {
                  if (keyEv.key === 'Enter') {
                    updateItemLabelEvent(item)
                  }
                },
              },
            },
            [
              ...((item.dirty?.length || 0) > 0 ? [this.$createElement('template', { slot: 'append' }, [
                this.$createElement(VBtn, {
                  props: {
                    icon: true,
                  },
                  on: {
                    click: () => {
                      updateItemLabelEvent(item)
                    },
                  },
                }, [
                  this.$createElement(VIcon, { props: { small: true } }, 'mdi-check'),
                ]),
              ])] : []),
            ]
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

      const itemValueUpdate = (newVal: any) => {
        this.$set(item, 'value', newVal)
        this.$set(item.parentRef, item.label, newVal)
        this.emitChanges()
      }
      if (['number', 'string'].includes(item.type)) {
        properties.push(
          this.$createElement(
            VTextField,
            {
              props: {
                solo: true,
                outlined: true,
                rounded: false,
                flat: true,
                dense: true,
                label: 'Item value',
                'hide-details': true,
                value: item.value,
                readonly: this.readonly,
                type: item.type === 'number' ? 'number' : 'text',
              },
              on: {
                change: itemValueUpdate,
              },
            }
          )
        )
      } else if (item.type === 'bool') {
        properties.push(
          this.$createElement(
            VSimpleCheckbox,
            {
              props: {
                solo: true,
                outlined: true,
                rounded: false,
                flat: true,
                dense: true,
                label: 'Item value',
                'hide-details': true,
                value: item.value === true,
                readonly: this.readonly,
              },
              on: {
                input: itemValueUpdate,
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
              item.type === 'array' ? 'Array (' + item.children?.length + ')'
                : (item.type === 'object' ? 'Object {' + item.children?.length + '}'
                  : item.value === null ? 'Null' : 'Object {}'),
            ]
          )
        )
      }

      return this.$createElement(
        'div',
        {
          staticClass: 'd-flex flex-row justify-start align-center my-1',
        },
        properties
      )
    },
    emitChanges () {
      const jsonValue = Array.isArray(this.internalValue) ? [] : {}
      const iterateTreeItems = (root: any, item: ItemTreeviewType[]) => {
        item.forEach((i: ItemTreeviewType) => {
          if (['object', 'array', 'json'].includes(i.type)) {
            const innerValue = i.type === 'array' ? [] : {}
            iterateTreeItems(innerValue, i.children ?? [])
            if (Array.isArray(root)) {
              root.push(innerValue)
            } else {
              root[i.label] = innerValue
            }
          } else {
            if (Array.isArray(root)) {
              root.push(i.value)
            } else {
              root[i.label] = i.value
            }
          }
        })
      }
      iterateTreeItems(jsonValue, this.treeViewItems)
      this.$emit('input', jsonValue)
    },
  },

  render (h): VNode {
    return this.genRoot()
  },
})
