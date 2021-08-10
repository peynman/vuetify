import { VNode, PropType } from 'vue'
import mixins, { ExtractVue } from '../../util/mixins'

import VIcon from '../VIcon'
import VBtn from '../VBtn'
import VLabel from '../VLabel'
import { VSpacer } from '../VGrid'
import { VDivider } from '../VDivider'
import { VToolbar } from '../VToolbar'
import { VTreeview } from '../VTreeview'

import VSchemaRenderer from '../VSchemaRenderer'
import VSchemaBuilderLabel from './VSchemaBuilderLabel'
import VSchemaBuilderAppend from './VSchemaBuilderAppend'

import { SchemaRendererComponent } from 'types/services/schemas'

import { cloneObjectWithParentCalculate, cloneObjectWithParentRemove, makeRandomId } from '../../util/helpers'
import { consoleError } from '../../util/console'
import EasyInteracts from '../../mixins/easyinteracts'

const baseMixins = mixins(
  EasyInteracts
  /* @vue/component */
)
interface options extends ExtractVue<typeof baseMixins> {
  $el: HTMLElement
}

export default baseMixins.extend<options>().extend({
  name: 'v-schema-builder',
  inheritAttrs: false,
  props: {
    label: {
      type: String,
      default: '',
    },
    startMode: {
      type: String,
      default: 'maker',
    },
    items: {
      type: Array as PropType<SchemaRendererComponent[]>,
      default: () => ([]),
    },
    value: null as any as PropType<any>,
  },

  data () {
    return {
      mode: this.startMode,
      editablePreview: false,
      treeview: this.items,
    }
  },

  methods: {
    onMoveFirst (item: SchemaRendererComponent) {
      if (item.parent && Array.isArray(item.parent.children)) {
        const index = item.parent.children.map((i: SchemaRendererComponent) => (i.id)).indexOf(item.id)
        if (index >= 0) {
          item.parent.children.splice(index, 1)
          item.parent.children.unshift(item)
        }
      }
    },
    onMoveLast (item: SchemaRendererComponent) {
      if (item.parent && Array.isArray(item.parent.children)) {
        const index = item.parent.children.map((i: SchemaRendererComponent) => (i.id)).indexOf(item.id)
        if (index >= 0) {
          item.parent.children.splice(index, 1)
          item.parent.children.push(item)
        }
      }
    },
    onMoveUp (item: SchemaRendererComponent) {
      if (item.parent && Array.isArray(item.parent.children)) {
        const index = item.parent.children.map((i: SchemaRendererComponent) => (i.id)).indexOf(item.id)
        if (index >= 0) {
          item.parent.children.splice(index, 1)
          item.parent.children.splice(index - 1, 0, item)
        }
      }
    },
    onMoveDown (item: SchemaRendererComponent) {
      if (item.parent && Array.isArray(item.parent.children)) {
        const index = item.parent.children.map((i: SchemaRendererComponent) => (i.id)).indexOf(item.id)
        if (index >= 0) {
          item.parent.children.splice(index, 1)
          item.parent.children.splice(index + 1, 0, item)
        }
      }
    },
    onChangeProps (item: SchemaRendererComponent, props: { [key: string]: any }) {
      const newProps: {[key: string]: any} = {}
      for (const prop in props) {
        newProps[prop] = props[prop]
      }
      item.props = newProps
    },
    onChangeAttributes (item: SchemaRendererComponent, attributes: { [key: string]: any }) {
      for (const attr in attributes) {
        item[attr] = attributes[attr]
      }
    },
    onChangeEvents (item: SchemaRendererComponent, events: { [key: string]: any }) {
      item.on = { ...events }
    },
    onChangeSlots (item: SchemaRendererComponent, slots: { [key: string]: any }) {
      item.slotDetails = slots
    },
    onAddChild (item: SchemaRendererComponent, tags: Array<string>) {
      if (tags.length > 0) {
        tags.forEach((tag: string) => {
          if (!item.children) {
            item.children = []
          }
          if (Array.isArray(item.children)) {
            item.children.push({
              tag,
              id: tag + '_' + makeRandomId(5),
              slot: 'default',
              parent: item,
              children: [],
            })
          }
        })
      }
    },
    onRemoveItem (item: SchemaRendererComponent) {
      if (item.parent && Array.isArray(item.parent.children)) {
        const itemIndex = item.parent.children.map((i: any) => (i.id)).indexOf(item.id)
        if (itemIndex >= 0) {
          item.parent.children.splice(itemIndex, 1)
        }
      }
    },
    onRefreshValues () {

    },
    onDownload () {
      const treeview = cloneObjectWithParentRemove(this.onGenerateSchema())
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(treeview, null, 2))
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
                  const json = JSON.parse(fileHandler.result)
                  this.treeview = [cloneObjectWithParentCalculate(json, null)]
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
    onGenerateSchema (): Partial<SchemaRendererComponent> {
      return this.treeview[0] as SchemaRendererComponent
    },
    genRoot (): VNode {
      const children = [
        this.genToolbar(),
      ]

      if (this.mode === 'maker') {
        children.push(this.genTreeEditor())
      }
      if (this.mode === 'viewer') {
        children.push(this.genPreview())
      }
      if (this.mode === 'editor') {
        children.push(this.genCoder())
      }
      return this.$createElement('div', {
        staticClass: 'd-flex flex-column',
      }, children)
    },
    genToolbar (): VNode {
      return this.$createElement(VToolbar,
        {
          staticClass: '',
          props: {
            flat: true,
            dense: true,
            dark: this.mode !== 'maker',
          },
        },
        [
          this.genToolbarButton(this.editablePreview ? 'mdi-image-edit' : 'mdi-image-filter-black-white', {
            color: this.editablePreview ? 'primary' : 'secondary',
          }, () => {
            this.editablePreview = !this.editablePreview
          }),
          this.genToolbarButton(this.mode === 'viewer' ? 'mdi-close' : 'mdi-eye', {
            color: this.mode === 'viewer' ? 'warning' : 'secondary',
          }, () => {
            this.mode = this.mode === 'viewer' ? 'maker' : 'viewer'
          }),
          this.genToolbarButton(this.mode === 'editor' ? 'mdi-close' : 'mdi-code-array', {
            color: this.mode === 'editor' ? 'warning' : 'secondary',
          }, () => {
            this.mode = this.mode === 'editor' ? 'maker' : 'editor'
          }),
          this.$createElement(
            VDivider,
            {
              staticClass: 'mx-3',
              props: {
                vertical: true,
                inset: true,
              },
            },
          ),
          this.$createElement(
            VLabel,
            {
              props: {
                dark: this.mode !== 'maker',
              },
              on: {
                click: () => {
                  this.mode = 'maker'
                },
              },
            },
            this.label
          ),
          this.$createElement(
            VSpacer
          ),
          this.genMenu(
            'mdi-refresh',
            'red',
            'Reset SchemaBuilder Tree',
            this.genRemoveItemMenuContent(() => {
              this.treeview = [
                {
                  tag: 'VSchemaRenderer',
                  id: 'root',
                  children: [],
                },
              ]
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
              staticClass: 'mx-3',
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
    genTreeEditor (): VNode {
      return this.$createElement(
        VTreeview,
        {
          props: {
            rounded: true,
            hoverable: true,
            items: this.treeview,
            dense: true,
            'multiple-active': true,
            'open-all': true,
            'item-key': 'id',
            'return-object': true,
          },
          scopedSlots: {
            label: e => {
              return [
                this.$createElement(VSchemaBuilderLabel, {
                  staticClass: 'ma-auto',
                  props: {
                    label: e.item?.id,
                    type: e.item?.tag,
                  },
                  on: {
                    'change-label': (newLabel: string) => {
                      e.item.id = newLabel
                    },
                  },
                }),
                this.$createElement(VSchemaBuilderAppend, {
                  staticClass: 'mt-n4 me-3',
                  props: {
                    item: e.item,
                  },
                  on: {
                    'move-first': this.onMoveFirst,
                    'move-last': this.onMoveLast,
                    'move-up': this.onMoveUp,
                    'move-down': this.onMoveDown,
                    'change-props': this.onChangeProps,
                    'change-attributes': this.onChangeAttributes,
                    'change-events': this.onChangeEvents,
                    'change-slots': this.onChangeSlots,
                    'add-child': this.onAddChild,
                    'remove-item': this.onRemoveItem,
                  },
                }),
              ]
            },
            append: e => {
              return null
            },
          },
        }
      )
    },
    genPreview (): VNode {
      const schema = this.onGenerateSchema()
      return this.$createElement(
        VSchemaRenderer,
        {
          props: {
            schema: {
              children: schema?.children,
            },
            bindings: schema.props?.bindings,
            editorMode: this.editablePreview,
          },
          on: {
            'move-first': this.onMoveFirst,
            'move-last': this.onMoveLast,
            'move-up': this.onMoveUp,
            'move-down': this.onMoveDown,
            'change-props': this.onChangeProps,
            'change-attributes': this.onChangeAttributes,
            'change-events': this.onChangeEvents,
            'change-slots': this.onChangeSlots,
            'add-child': this.onAddChild,
            'remove-item': this.onRemoveItem,
          },
        },
      )
    },
    genCoder (): VNode {
      return this.$createElement(
        'pre',
        {
        },
        JSON.stringify(cloneObjectWithParentRemove(this.onGenerateSchema()), null, 2)
      )
    },
  },

  render (h): VNode {
    return this.genRoot()
  },
})
