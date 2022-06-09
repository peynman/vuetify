import { VNode, PropType } from 'vue'
import mixins, { ExtractVue } from '../../util/mixins'

import VIcon from '../VIcon/VIcon'
import VBtn from '../VBtn/VBtn'
import VLabel from '../VLabel/VLabel'
import VSpacer from '../VGrid/VSpacer'
import VDivider from '../VDivider/VDivider'
import VToolbar from '../VToolbar/VToolbar'
import VTreeview from '../VTreeview/VTreeview'
import { VList, VListItem, VListItemTitle, VListItemSubtitle, VListItemContent, VListItemGroup, VListItemIcon } from '../VList'
import VAutocomplete from '../VAutocomplete/VAutocomplete'
import VTextField from '../VTextField/VTextField'
import VChip from '../VChip/VChip'

import VSchemaRenderer from '../VSchemaRenderer/VSchemaRenderer'
import VSchemaBuilderLabel from './VSchemaBuilderLabel'
import VSchemaBuilderItemProperties from './properties/VSchemaBuilderItemProperties'

import { CustomPropertyResolver, SchemaRendererComponent, TagSettings, SelectableItem, TagSlot } from 'types/services/schemas'

import { cloneObjectWithCallbackOnKey, cloneObjectWithParentCalculate, cloneObjectWithParentRemove, makeRandomId } from '../../util/helpers'
import { consoleError } from '../../util/console'
import EasyInteracts from '../../mixins/easyinteracts'
import { VTextarea } from '../VTextarea'

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
    loaderMode: {
      type: Boolean,
      default: false,
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
    componentsDictionary: {
      type: Object as PropType<{ [key: string]: TagSettings }>,
      default: () => ({}),
    },
    rendererPreProcessor: {
      type: Function,
      default: undefined,
    },
    customPropertyResolver: null as any as PropType<CustomPropertyResolver>,
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
      addBlockItems: [] as Array<string>,
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
    typeNamesArrayList (): SelectableItem[] {
      return Object.keys(this.componentsDictionary).map((key: string) => ({
        name: key,
        text: this.componentsDictionary[key].name,
      }))
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
        this.$set(item, attr, attributes[attr])
      }
      this.$emit('input', this.generatedSchema)
    },
    onChangeEvents (item: SchemaRendererComponent, events: { [key: string]: any }) {
      this.$set(item, 'on', { ...events })
      this.$emit('input', this.generatedSchema)
    },
    onChangeSlots (item: SchemaRendererComponent, slots: { [key: string]: any }) {
      this.$set(item, 'slotDetails', slots)
      this.$set(item, 'slot', slots.slot)
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
    genAddBlockDialogContent (item: SchemaRendererComponent): VNode[] {
      return [
        this.$createElement(
          VAutocomplete,
          {
            staticClass: 'mx-1 my-auto',
            props: {
              color: 'secondary',
              'x-small': true,
              block: false,
              outlined: true,
              items: this.typeNamesArrayList,
              chips: true,
              multiple: true,
              dense: true,
              'hide-details': true,
              autofocus: true,
              value: [],
            },
            on: {
              input: (e: Array<string>) => {
                this.addBlockItems = e
              },
            },
          }
        ),
        this.genIconButton(
          'mdi-plus-box',
          'success',
          () => {
            this.onAddChild(item, this.addBlockItems)
          },
          {
            'x-small': false,
            dense: true,
            iconProps: {
              'x-small': false,
            },
          }
        ),
      ]
    },
    genChangeSlotMenuContent (item: SchemaRendererComponent): VNode {
      const parentTag = item.parent?.tag ?? ''
      // rendering list of av slot names
      const avSlotsList = this.componentsDictionary?.[parentTag]?.slots?.map((slot: TagSlot) => {
        const slotDetails = [
          this.$createElement(VListItemContent, {}, [
            this.$createElement(VListItemTitle, {}, [slot.name]),
            this.$createElement(VListItemSubtitle, {}, [slot.description]),
          ]),
        ]

        if (slot.name.includes('<name>')) {
          let namedSlotValue = ''
          if (typeof item.slot === 'object') {
            const namedDetails = item.slot as any
            if (slot.name === namedDetails.slot) {
              namedSlotValue = namedDetails.name
            }
          }
          slotDetails.push(
            this.$createElement(VTextField,
              {
                props: {
                  dense: true,
                  label: 'Slot name',
                  'hide-details': true,
                  value: namedSlotValue,
                },
                on: {
                  change: (name: any) => {
                    this.onChangeSlots(item, { slot: slot.name, name, scoped: true })
                  },
                },
              }
            )
          )
        }

        return this.$createElement(VListItem, {
          props: {
            value: slot.name,
          },
          on: {
            click: (e: MouseEvent) => {
              this.onChangeSlots(item, { slot: slot.name, name, scoped: slot.vueProperties !== undefined })
            },
          },
        }, slotDetails)
      })

      let slotNameValue = item.slot
      if (typeof item.slot === 'object') {
        const namedDetails = item.slot as any
        slotNameValue = namedDetails.slot
      }

      return this.$createElement(VList, {
        props: {
          dense: true,
          'two-line': true,
        },
      }, [
        this.$createElement(VListItemGroup, {
          props: {
            value: slotNameValue,
          },
        }, avSlotsList),
      ])
    },
    genItemMenuToFuncCallback (item: SchemaRendererComponent) {
      return (move: any) => {
        return this.$createElement(VListItem, {
          props: {
            value: move.id,
          },
          on: {
            click: (e: MouseEvent) => {
              move.func(item)
            },
          },
        }, [
          this.$createElement(VListItemIcon, {}, [
            this.$createElement(VIcon, {}, move.icon),
          ]),
          this.$createElement(VListItemContent, {}, [
            this.$createElement(VListItemTitle, {}, [move.title]),
          ]),
        ])
      }
    },
    genItemMoveMenuContent (item: SchemaRendererComponent): VNode {
      const avMoves = [
        {
          id: 0,
          name: 'first',
          title: 'Move first',
          icon: 'mdi-chevron-double-up',
          func: this.onMoveFirst,
        },
        {
          id: 1,
          name: 'up',
          title: 'Move up',
          icon: 'mdi-chevron-up',
          func: this.onMoveUp,
        },
        {
          id: 2,
          name: 'down',
          title: 'Move down',
          icon: 'mdi-chevron-down',
          func: this.onMoveDown,
        },
        {
          id: 3,
          name: 'last',
          title: 'Move last',
          icon: 'mdi-chevron-double-down',
          func: this.onMoveLast,
        },
      ].map(this.genItemMenuToFuncCallback(item))

      return this.$createElement(VList, {
        props: {
          dense: true,
        },
      }, [
        this.$createElement(VListItemGroup, {
          props: {
          },
        }, avMoves),
      ])
    },
    genItemPasteMenuContent (item: SchemaRendererComponent): VNode {
      const avMoves = [
        {
          id: 0,
          name: 'sibling',
          title: 'Paste as sibling',
          icon: 'mdi-source-pull',
          func: this.onPasteItemAsSibling,
        },
        {
          id: 1,
          name: 'child',
          title: 'Paste as child',
          icon: 'mdi-source-merge',
          func: this.onPasteItemAsChild,
        },
      ].map(this.genItemMenuToFuncCallback(item))
      return this.$createElement(VList, {
        props: {
          dense: true,
        },
      }, [
        this.$createElement(VListItemGroup, {
          props: {
          },
        }, avMoves),
      ])
    },
    genItemTreeviewTools (item: SchemaRendererComponent): VNode[] {
      const extras: VNode[] = [
        this.genIconDialog(
          'mdi-cog',
          'primary',
          this.$vuetify.lang.t('$vuetify.schemaBuilder.settingsTitle', item.id ?? 0),
          [
            this.$createElement(VSchemaBuilderItemProperties, {
              props: {
                item: cloneObjectWithParentRemove(item),
                properties: this.componentsDictionary[item.tag ?? ''],
                customPropertyResolver: this.customPropertyResolver,
              },
              on: {
                'change-props': (e: any) => {
                  this.onChangeProps(item, e)
                },
                'change-events': (e: any) => {
                  this.onChangeEvents(item, e)
                },
                'change-attributes': (e: any) => {
                  this.onChangeAttributes(item, e)
                },
              },
            }),
          ],
          null,
          {
            'x-small': true,
            iconProps: {
              'x-small': true,
            },
          }
        ),
      ]
      let canAddBlocks = false
      const isRoot = item.parent === null || item.parent === undefined
      const dictionaryType = this.componentsDictionary[item.tag ?? '']
      if (dictionaryType?.slots && dictionaryType.slots?.length > 0) {
        canAddBlocks = true
      }
      if (item.tag === 'VSchemaRenderer') {
        canAddBlocks = true
      }

      if (!isRoot) {
        extras.push(
          this.genIconButton('mdi-content-copy', 'primary', (e: any) => {
            this.onCopyItem(item)
          }, {
            'x-small': true,
            iconProps: {
              'x-small': true,
            },
          })
        )
        extras.push(
          this.genMenu('mdi-content-paste', 'warning', 'Paste', [this.genItemPasteMenuContent(item)], null, {
            'close-on-content-click': false,
          }, {
            'x-small': true,
            iconProps: {
              'x-small': true,
            },
          })
        )
        extras.push(
          this.genMenu('mdi-arrow-up-down', 'primary', 'Move #' + item.id, [this.genItemMoveMenuContent(item)], null, {
            'close-on-content-click': false,
          }, {
            'x-small': true,
            iconProps: {
              'x-small': true,
            },
          })
        )
        if (item.parent?.tag) {
          const dictionaryParentType = this.componentsDictionary?.[item.parent?.tag ?? '']
          if (dictionaryParentType?.slots && dictionaryParentType.slots?.length > 0) {
            extras.push(this.genMenu('mdi-toy-brick-marker', 'secondary', 'Select component slot', [
              this.genChangeSlotMenuContent(item),
            ], null, {
              'close-on-content-click': false,
            }, {
              'x-small': true,
              iconProps: {
                'x-small': true,
              },
            }))
          }
        }

        extras.push(
          this.genMenu(
            'mdi-toy-brick-remove',
            'red', this.$vuetify.lang.t('$vuetify.schemaBuilder.removeWarning', item.id ?? 0),
            this.genRemoveItemMenuContent(() => {
              this.onRemoveItem(item)
            }), null, {}, {
              'x-small': true,
              iconProps: {
                'x-small': true,
              },
            })
        )
      } else {
        extras.push(
          this.genIconButton('mdi-content-paste', 'warning', (e: any) => {
            this.onPasteItemAsChild(item)
          }, {
            'x-small': true,
            iconProps: {
              'x-small': true,
            },
          })
        )
      }

      if (canAddBlocks) {
        extras.push(
          this.genIconDialog('mdi-toy-brick-plus', 'success', 'Add new block', this.genAddBlockDialogContent(item), null, {
            'x-small': true,
            iconProps: {
              'x-small': true,
            },
          })
        )
      }

      return extras
    },
    genItemSettingsNode (item: SchemaRendererComponent): VNode {
      return this.$createElement(
        'div',
        {
          staticClass: 'd-flex flex-row justify-end',
        },
        [
          this.$createElement(VChip, {
            staticClass: '',
            props: {
              dense: true,
              small: true,
            },
          },
          [
            this.$createElement(VChip, {
              staticClass: '',
              props: {
                dense: true,
                'x-small': true,
                color: 'secondary',
              },
            }, item.tag),
            ...this.genItemTreeviewTools(item),
          ])],
      )
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
          this.genItemSettingsNode(this.rootChild),
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
                this.$createElement(
                  VSchemaBuilderLabel,
                  {
                    staticClass: 'ma-auto',
                    props: {
                      label: e.item?.id,
                      type: e.item?.tag,
                    },
                    on: {
                      'change-label': (newLabel: string) => {
                        this.$set(e.item, 'id', newLabel)
                        if (this.autoReactive) {
                          this.$set(e.item, 'v-model', `$(bindings.${newLabel})`)
                        }
                      },
                    },
                  }),
                this.$createElement(
                  'div',
                  {
                    style: {
                      position: 'absolute',
                      bottom: '-6px',
                      [this.$vuetify.rtl ? 'left' : 'right']: '30px',
                    },
                  },
                  [this.genItemSettingsNode(e.item)],
                ),
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
            previewMode: true,
            loaderMode: this.loaderMode,
            componentsDictionary:
              Object.keys(this.componentsDictionary ?? {})
                .filter((key: string) => (this.componentsDictionary[key].factory))
                .reduce((factory: any, type: any) => {
                  factory[type.name] = type.factory
                  return factory
                }, {}),
            preProcessor: this.rendererPreProcessor,
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
