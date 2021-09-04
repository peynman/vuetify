import { VNode, VNodeChildren, PropType } from 'vue'
import mixins, { ExtractVue } from '../../util/mixins'
import EasyInteracts from '../../mixins/easyinteracts'

import VIcon from '../VIcon'
import { SchemaRendererComponent } from 'types/services/schemas'
import { VList, VListItem, VListItemTitle, VListItemSubtitle, VListItemContent, VListItemGroup, VListItemIcon } from '../VList'
import VChip from '../VChip'
import VAutocomplete from '../VAutocomplete'
import { GetItemTypeSettingsFromDictionary, TypesDictionary } from './helpers/TagHelpers'
import VSchemaBuilderItemProperties from './properties/VSchemaBuilderItemProperties'
import { VTextField } from '../VTextField'

const baseMixins = mixins(
  EasyInteracts
  /* @vue/component */
)
interface options extends ExtractVue<typeof baseMixins> {
  $el: HTMLElement
}

export default baseMixins.extend<options>().extend({
  name: 'v-schema-builder-append',

  inheritAttrs: false,

  props: {
    item: {
      type: Object as PropType<SchemaRendererComponent>,
      default: () => (<SchemaRendererComponent>{}),
    },
    extraTypes: {
      type: Array,
      default: () => ([]),
    },
  },

  data: () => ({
    addBlockItems: [] as Array<string>,
    settingsTabsModel: 'properties',
  }),

  computed: {
    typesDictionary (): { [key: string]: any } {
      return this.extraTypes?.reduce((dic: { [key: string]: any }, type: any) => {
        dic[type.name] = type
        return dic
      }, TypesDictionary) as { [key: string]: any }
    },
    typeNamesArrayList (): any[] {
      const items = []
      for (const block in TypesDictionary) {
        const def = TypesDictionary[block]
        items.push({
          id: def.name,
          title: def.name,
        })
      }
      for (const block in this.extraTypes) {
        const def = this.extraTypes[block] as { [key: string]: any }
        items.push({
          id: def.name,
          title: def.name,
        })
      }
      return items
    }
  },

  methods: {
    genAddBlockDialogContent (): VNodeChildren {
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
              'item-text': 'title',
              'item-value': 'id',
              chips: true,
              multiple: true,
              dense: true,
              'hide-details': true,
              autofocus: true,
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
            this.$emit('add-child', this.item, this.addBlockItems)
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
    genChangeSlotMenuContent (): VNode {
      const parentTag = this.item.parent?.tag ?? ''
      // rendering list of av slot names
      const avSlotsList = TypesDictionary[parentTag]?.slots?.map((slot: any) => {
        const slotDetails = [
          this.$createElement(VListItemContent, {}, [
            this.$createElement(VListItemTitle, {}, [slot.name]),
            this.$createElement(VListItemSubtitle, {}, [slot.description]),
          ]),
        ]

        if (slot.name.includes('<name>')) {
          let namedSlotValue = ''
          if (typeof this.item.slot === 'object') {
            const namedDetails = this.item.slot as any
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
                    this.$emit('change-slots', this.item, { slot: slot.name, name, scoped: true })
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
              this.$emit('change-slots', this.item, { slot: slot.name, scoped: slot['vue-properties'] !== undefined })
            },
          },
        }, slotDetails)
      })

      let slotNameValue = this.item.slot
      if (typeof this.item.slot === 'object') {
        const namedDetails = this.item.slot as any
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
    genItemMoveMenuContent (): VNode {
      const avMoves = [
        {
          id: 0,
          name: 'first',
          title: 'Move first',
          icon: 'mdi-chevron-double-up',
        },
        {
          id: 1,
          name: 'up',
          title: 'Move up',
          icon: 'mdi-chevron-up',
        },
        {
          id: 2,
          name: 'down',
          title: 'Move down',
          icon: 'mdi-chevron-down',
        },
        {
          id: 3,
          name: 'last',
          title: 'Move last',
          icon: 'mdi-chevron-double-down',
        },
      ].map((move: any) => {
        return this.$createElement(VListItem, {
          props: {
            value: move.id,
          },
          on: {
            click: (e: MouseEvent) => {
              this.$emit('move-' + move.name, this.item)
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
      })

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
  },
  render (h): VNode {
    const dictionaryType = GetItemTypeSettingsFromDictionary(this.item)
    const extras = []
    let canAddBlocks = false
    const isRoot = this.item.parent === null || this.item.parent === undefined

    if (dictionaryType?.slots && dictionaryType.slots?.length > 0) {
      canAddBlocks = true
    }
    if (this.item.tag === 'VSchemaRenderer') {
      canAddBlocks = true
    }

    if (!isRoot) {
      extras.push(
        this.genMenu('mdi-arrow-up-down', 'primary', 'Move #' + this.item.id, [this.genItemMoveMenuContent()], null, {
          'close-on-content-click': false,
        }, {
          'x-small': true,
          iconProps: {
            'x-small': true,
          },
        })
      )
      extras.push(
        this.genIconButton('mdi-content-copy', 'primary', (e: any) => {
          this.$emit('copy-item', this.item)
        }, {
          'x-small': true,
          iconProps: {
            'x-small': true,
          },
        })
      )
      extras.push(
        this.genIconButton('mdi-content-paste', 'warning', (e: any) => {
          this.$emit('paste-item', this.item)
        }, {
          'x-small': true,
          iconProps: {
            'x-small': true,
          },
        })
      )

      if (this.item.parent?.tag) {
        const dictionaryParentType = GetItemTypeSettingsFromDictionary(this.item.parent)
        if (dictionaryParentType?.slots && dictionaryParentType.slots?.length > 0) {
          extras.push(this.genMenu('mdi-toy-brick-marker', 'secondary', 'Select component slot', [
            this.genChangeSlotMenuContent(),
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
        this.genMenu('mdi-toy-brick-remove', 'red', 'Remove item #' + this.item.id + '?', this.genRemoveItemMenuContent(() => {
          this.$emit('remove-item', this.item)
        }), null, {}, {
          'x-small': true,
          iconProps: {
            'x-small': true,
          },
        })
      )
    }

    if (canAddBlocks) {
      extras.push(
        this.genIconDialog('mdi-toy-brick-plus', 'success', 'Add new block', this.genAddBlockDialogContent(), null, {
          'x-small': true,
          iconProps: {
            'x-small': true,
          },
        })
      )
    }

    return h(
      'div',
      { staticClass: 'd-flex flex-row justify-end' },
      [
        h(VChip, {
          staticClass: '',
          props: {
            dense: true,
            small: true,
          },
        }, [
          h(VChip, {
            staticClass: '',
            props: {
              dense: true,
              'x-small': true,
              color: 'secondary',
            },
          }, this.item.tag),
          this.genIconDialog('mdi-cog', 'primary', '#' + this.item.id + ' Settings', [
            h(VSchemaBuilderItemProperties, {
              props: {
                item: this.item,
                properties: this.item.tag ? this.typesDictionary[this.item.tag] : {},
              },
              on: {
                'change-props': (e: any) => {
                  this.$emit('change-props', this.item, e)
                },
                'change-events': (e: any) => {
                  this.$emit('change-events', this.item, e)
                },
                'change-attributes': (e: any) => {
                  this.$emit('change-attributes', this.item, e)
                },
              },
            }),
          ], (e: any) => {
          }, {
            'x-small': true,
            iconProps: {
              'x-small': true,
            },
          }),
          ...extras,
        ]),
      ]
    )
  },

})
