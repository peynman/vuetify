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

import { cloneObjectWithCallbackOnKey, cloneObjectWithParentCalculate, cloneObjectWithParentRemove, makeRandomId } from '../../util/helpers'
import { consoleError } from '../../util/console'
import EasyInteracts from '../../mixins/easyinteracts'
import { VTextarea } from '../VTextarea'
import { VWindow } from '../VWindow'
import { VSheet } from '../VSheet'

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
    value: {
      type: Object as PropType<SchemaRendererComponent>,
      default: () => ({
        id: 'root',
        tag: 'VSchemaRenderer',
        props: {
          bindings: [],
        },
      } as SchemaRendererComponent),
    },
    extraTypes: {
      type: Array,
      default: () => ([]),
    },
  },

  data () {
    let schema = cloneObjectWithParentCalculate(this.value, null)
    if (schema === null) {
      schema = {
        id: 'root',
        tag: 'VSchemaRenderer',
        props: {
          bindings: [],
        },
        children: [],
      }
    }
    return {
      mode: this.startMode,
      editablePreview: false,
      rootChild: schema,
      autoReactive: true,
    }
  },

  computed: {
    generatedSchema (): Partial<SchemaRendererComponent> {
      return cloneObjectWithParentRemove(this.rootChild)
    },
    recalculateIdOnPasteFunction () {
      return (id: string) => {
        const _index = id.lastIndexOf('_')
        if (_index >= 0) {
          return id.substr(0, _index) + '_' + makeRandomId(5)
        } else {
          return id + '_' + makeRandomId(5)
        }
      }
    },
  },

  watch: {
    value: {
      deep: true,
      handler () {
        this.rootChild = cloneObjectWithParentCalculate(this.value, null)
        this.$forceUpdate()
      },
    },
  },

  methods: {
    onMoveFirst (item: SchemaRendererComponent) {
      if (item.parent && Array.isArray(item.parent.children)) {
        const index = item.parent.children.map((i: SchemaRendererComponent) => (i.id)).indexOf(item.id)
        if (index >= 0) {
          item.parent.children.splice(index, 1)
          item.parent.children.unshift(item)
        }

        this.$emit('input', this.generatedSchema)
      }
    },
    onMoveLast (item: SchemaRendererComponent) {
      if (item.parent && Array.isArray(item.parent.children)) {
        const index = item.parent.children.map((i: SchemaRendererComponent) => (i.id)).indexOf(item.id)
        if (index >= 0) {
          item.parent.children.splice(index, 1)
          item.parent.children.push(item)
        }

        this.$emit('input', this.generatedSchema)
      }
    },
    onMoveUp (item: SchemaRendererComponent) {
      if (item.parent && Array.isArray(item.parent.children)) {
        const index = item.parent.children.map((i: SchemaRendererComponent) => (i.id)).indexOf(item.id)
        if (index >= 0) {
          item.parent.children.splice(index, 1)
          item.parent.children.splice(index - 1, 0, item)
        }

        this.$emit('input', this.generatedSchema)
      }
    },
    onMoveDown (item: SchemaRendererComponent) {
      if (item.parent && Array.isArray(item.parent.children)) {
        const index = item.parent.children.map((i: SchemaRendererComponent) => (i.id)).indexOf(item.id)
        if (index >= 0) {
          item.parent.children.splice(index, 1)
          item.parent.children.splice(index + 1, 0, item)
        }

        this.$emit('input', this.generatedSchema)
      }
    },
    onChangeProps (item: SchemaRendererComponent, props: { [key: string]: any }) {
      const newProps: {[key: string]: any} = {}
      for (const prop in props) {
        newProps[prop] = props[prop]
      }
      this.$set(item, 'props', newProps)
      this.$emit('input', this.generatedSchema)
    },
    onChangeAttributes (item: SchemaRendererComponent, attributes: { [key: string]: any }) {
      for (const attr in attributes) {
        item[attr] = attributes[attr]
      }
      this.$emit('input', this.generatedSchema)
    },
    onChangeEvents (item: SchemaRendererComponent, events: { [key: string]: any }) {
      item.on = { ...events }
      this.$emit('input', this.generatedSchema)
    },
    onChangeSlots (item: SchemaRendererComponent, slots: { [key: string]: any }) {
      item.slotDetails = slots
      this.$emit('input', this.generatedSchema)
    },
    onAddChild (item: SchemaRendererComponent, tags: Array<string>) {
      if (tags.length > 0) {
        tags.forEach((tag: string) => {
          if (!item.children) {
            this.$set(item, 'children', [])
          }
          if (Array.isArray(item.children)) {
            this.$set(item.children, item.children.length, {
              tag,
              id: tag + '_' + makeRandomId(5),
              slot: 'default',
              parent: item,
              children: [],
            })
          }
        })
        this.$emit('input', this.generatedSchema)
      }
    },
    onRemoveItem (item: SchemaRendererComponent) {
      if (item.parent && Array.isArray(item.parent.children)) {
        const itemIndex = item.parent.children.map((i: any) => (i.id)).indexOf(item.id)
        if (itemIndex >= 0) {
          item.parent.children.splice(itemIndex, 1)
          this.$emit('input', this.generatedSchema)
        }
      }
    },
    onRefreshValues () {

    },
    onCopyItem (item: SchemaRendererComponent) {
      navigator.clipboard.writeText(JSON.stringify(cloneObjectWithParentRemove(item)))
    },
    onPasteItemAsSibling (item: SchemaRendererComponent) {
      navigator.clipboard.readText().then((str: string) => {
        try {
          const obj = cloneObjectWithParentCalculate(
            cloneObjectWithCallbackOnKey(
              JSON.parse(str),
              this.recalculateIdOnPasteFunction
            ),
            null
          )
          if (item.parent && Array.isArray(item.parent.children) && item.parent.children.length) {
            obj.parent = item.parent
            this.$set(item.parent.children, item.parent.children?.length, obj)
            this.$emit('input', this.generatedSchema)
          }
        } catch (e: any) {
          consoleError(e)
        }
      }).catch((e: any) => {
        consoleError(e)
      })
    },
    onPasteItemAsChild (item: SchemaRendererComponent) {
      navigator.clipboard.readText().then((str: string) => {
        try {
          const obj = cloneObjectWithParentCalculate(
            cloneObjectWithCallbackOnKey(
              JSON.parse(str),
              this.recalculateIdOnPasteFunction
            ),
            null
          )
          if (!item.children) {
            this.$set(item, 'children', [])
          }
          if (Array.isArray(item.children)) {
            obj.parent = item
            this.$set(item.children, item.children.length, obj)
            this.$emit('input', this.generatedSchema)
          }
        } catch (e: any) {
          consoleError(e)
        }
      }).catch((e: any) => {
        consoleError(e)
      })
    },
    onDownload () {
      const treeview = this.generatedSchema
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
                  this.rootChild = cloneObjectWithParentCalculate(json, null)
                  this.$emit('input', this.generatedSchema)
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
          this.genTooltip(
            this.$vuetify.lang.t('$vuetify.schemaBuilder.editorMode'),
            (on: any) => {
              return this.genToolbarButton(this.editablePreview ? 'mdi-image-edit' : 'mdi-image-filter-black-white', {
                color: this.editablePreview ? 'primary' : 'secondary',
              }, () => {
                this.editablePreview = !this.editablePreview
              }, on)
            }
          ),
          this.genTooltip(
            this.$vuetify.lang.t('$vuetify.schemaBuilder.autoReactive'),
            (on: any) => {
              return this.genToolbarButton('mdi-vuejs', {
                color: this.autoReactive ? 'primary' : 'secondary',
              }, () => {
                this.autoReactive = !this.autoReactive
              }, on)
            }
          ),
          this.genTooltip(
            this.$vuetify.lang.t('$vuetify.schemaBuilder.preview'),
            (on: any) => {
              return this.genToolbarButton(this.mode === 'viewer' ? 'mdi-close' : 'mdi-eye', {
                color: this.mode === 'viewer' ? 'warning' : 'secondary',
              }, () => {
                this.mode = this.mode === 'viewer' ? 'maker' : 'viewer'
              }, on)
            }
          ),
          this.genTooltip(
            this.$vuetify.lang.t('$vuetify.schemaBuilder.code'),
            (on: any) => {
              return this.genToolbarButton(this.mode === 'editor' ? 'mdi-close' : 'mdi-code-array', {
                color: this.mode === 'editor' ? 'warning' : 'secondary',
              }, () => {
                this.mode = this.mode === 'editor' ? 'maker' : 'editor'
              }, on)
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
          this.$createElement(
            VSchemaBuilderAppend,
            {
              props: {
                item: this.rootChild,
                extraTypes: this.extraTypes,
              },
              on: {
                'change-props': this.onChangeProps,
                'change-attributes': this.onChangeAttributes,
                'change-events': this.onChangeEvents,
                'add-child': this.onAddChild,
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
          this.genMenu(
            'mdi-refresh',
            'red',
            'Reset SchemaBuilder Tree',
            this.genRemoveItemMenuContent(() => {
              this.rootChild = {
                tag: 'VSchemaRenderer',
                props: {
                  bindings: [],
                },
                children: [],
              }
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
    genToolbarButton (icon: string, props: any, click: Function, on: any = {}): VNode {
      return this.$createElement(VBtn, {
        props: {
          icon: true,
          small: true,
          ...props,
        },
        on: {
          ...on,
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
            items: this.rootChild.children,
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
                      if (this.autoReactive) {
                        e.item['v-model'] = `$(bindings.${newLabel})`
                      }
                    },
                  },
                }),
                this.$createElement(VSchemaBuilderAppend, {
                  staticClass: 'mt-n4 me-3',
                  props: {
                    item: e.item,
                    extraTypes: this.extraTypes,
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
                    'copy-item': this.onCopyItem,
                    'paste-siblint': this.onPasteItemAsSibling,
                    'paste-child': this.onPasteItemAsChild,
                  },
                }),
              ]
            },
          },
        }
      )
    },
    genPreview (): VNode {
      return this.$createElement(
        VSchemaRenderer,
        {
          staticClass: this.rootChild.staticClass,
          props: {
            children: this.rootChild.children,
            attributes: this.rootChild.attributes,
            wrap: this.rootChild.wrap,
            wrapClass: this.rootChild.wrapClass,
            wrapAtrributes: this.rootChild.wrapAttributes,
            wrapStyle: this.rootChild.wrapStyle,
            ...this.rootChild.props,
            editorMode: this.editablePreview,
            componentsDictionary: this.extraTypes?.filter((type: any) => (type.factory)).reduce((factory: any, type: any) => {
              factory[type.name] = type.factory
              return factory
            }, {}),
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
        }
      )
    },
    genCoder (): VNode {
      return this.$createElement(
        VTextarea,
        {
          staticStyle: {
            direction: 'ltr',
          },
          props: {
            rows: 15,
            rowHeight: 10,
            counter: true,
            value: JSON.stringify(cloneObjectWithParentRemove(this.generatedSchema), null, 2),
          },
        },
      )
    },
  },

  render (h): VNode {
    return this.genRoot()
  },
})
