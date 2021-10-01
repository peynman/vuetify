import mixins, { ExtractVue } from '../../util/mixins'

import CrudConsumer from './CrudConsumer'
import VAutocomplete from '../VAutocomplete'
import { defaultMenuProps as VSelectMenuProps } from '../VSelect/VSelect'
import VSelectList from '../VSelect/VSelectList'
import { DecorateLabelHelper } from '../../mixins/decoratable'

import { VNode } from 'vue/types/umd'
import { PropType } from 'vue'
import VCrudToolbar, { CrudToolbarScopedItem } from './VCrudToolbar'
import { CrudQueryResult, CrudResource, CrudTableSettings } from 'types/services/crud'
import { consoleError } from '../../util/console'
import { VCard, VCardText, VCardTitle, VCardActions } from '../VCard'
import EasyInteracts from '../../mixins/easyinteracts'
import VCrudPagination from './VCrudPagination'
import { VProgressLinear } from 'vuetify/lib'
import { mergeDeep } from '../../util/helpers'

const defaultMenuProps = {
  ...VSelectMenuProps,
  maxHeight: 340,
}

const baseMixins = mixins(
  EasyInteracts,
  CrudConsumer,
  VAutocomplete,
  DecorateLabelHelper,
  /* @vue/component */
)
interface options extends ExtractVue<typeof baseMixins> {
  $el: HTMLElement
}

export default baseMixins.extend<options>().extend({
  name: 'v-crud-object-picker',

  inheritAttrs: false,

  props: {
    decorateLabel: String,
    decorateMap: {
      type: Object as PropType<{ [key: string]: string }>,
      default: () => ({}),
    },
    crudLoaderFunction: {
      type: Function as PropType<Function> | undefined,
      default: undefined,
    },
    valueSettings: {
      type: Object as PropType<CrudTableSettings>,
      default: () => ({
        perPage: 10,
      }),
    },
    valueFilters: {
      type: Object as PropType<{ [key: string]: any }>,
      default: () => ({}),
    },
    autoLoad: {
      type: Boolean,
      default: true,
    },
    itemsPerPage: {
      type: Number,
      default: 10,
    },
    totalVisible: Number,
  },

  data () {
    return {
      currPageItems: [] as any[],
      total: 0,
      currPage: 1,
      refId: 1,
      isLoading: false,
      settings: mergeDeep({}, this.valueSettings ?? {}) as CrudTableSettings,
      filters: mergeDeep({}, this.valueFilters ?? {}) as { [key: string]: any },
      searchTerm: undefined as String|undefined,
    }
  },

  watch: {
    valueSettings () {
      this.settings = mergeDeep({}, this.valueSettings)
    },
    valueFilters () {
      this.filters = mergeDeep({}, this.valueFilters)
    },
  },

  mounted (): void {
    if (this.autoLoad && this.crudResource) {
      this.loadItems(this.crudResource, 1, this.showItemsPerPage, this.settings, this.filters)
    }
  },

  computed: {
    $_menuProps (): object {
      const props = VAutocomplete.options.computed.$_menuProps.call(this)
      return {
        ...defaultMenuProps,
        ...props,
        maxHeight: 340,
      }
    },
    allItems (): object[] {
      return this.currPageItems.map((item: any) => ({
        [this.itemValue.toString()]: item[this.crudResource?.primaryKey ?? 'id'],
        [this.itemText.toString()]: this.calculateLabel(this.decorateLabel, this.decorateMap, item),
      }))
    },
    showItemsPerPage (): number {
      return this.settings?.perPage?.valueOf() ?? this.itemsPerPage.valueOf()
    },
  },

  methods: {
    loadItems (crud: CrudResource, page: number, limit: number, settings?: Object, filters?: Object, search?: String) {
      if (this.crudLoaderFunction) {
        this.isLoading = true
        this.crudLoaderFunction(crud, page, limit, settings, filters, search).then((resolved: CrudQueryResult) => {
          this.currPageItems = resolved.items
          this.total = resolved.total
          this.currPage = resolved.currPage
        }).catch((e: any) => {
          consoleError(e)
        }).finally(() => {
          this.isLoading = false
        })
      }
    },
    genToolbar (): VNode {
      return this.$createElement(
        VCrudToolbar,
        {
          staticClass: 'flex-grow-1',
          staticStyle: {
            position: 'relative',
          },
          props: {
            crud: this.crud,
            showSettings: false,
            showActions: false,
            showCreate: false,
            dense: true,
            small: true,
            loading: this.isLoading,
          },
          scopedSlots: {
            'prepend-tools': (data: CrudToolbarScopedItem) => {
              if (data.mode !== 'default') return ''
              if (!this.multiple) return ''

              return this.genTooltip(
                this.$vuetify.lang.t('$vuetify.crud.picker.selectAll'),
                (on: any, value: boolean) => this.genIconButton('mdi-check-all', 'secondary', (e: any) => {

                }, {
                  small: true,
                  iconProps: {
                    small: true,
                  },
                },
                on)
              )
            },
          },
          on: {
            reload: (crud: CrudResource, settings: CrudTableSettings, filters: Object, searchTerm: string) => {
              this.filters = filters
              this.settings = settings
              this.searchTerm = searchTerm
              this.loadItems(
                crud,
                this.currPage,
                this.showItemsPerPage,
                settings,
                filters,
                searchTerm,
              )
            },
          },
        },
      )
    },
    genPagination (): VNode {
      return this.$createElement(
        VCrudPagination,
        {
          staticClass: 'flex-grow-1',
          props: {
            loading: this.isLoading,
            totalVisible: this.totalVisible,
            total: this.total,
            pageCount: parseInt(Math.ceil(this.total / this.showItemsPerPage)),
            itemsCount: this.currPageItems.length,
            perPage: this.showItemsPerPage,
            value: this.currPage,
          },
          on: {
            input: (page: number) => {
              if (this.crudResource) {
                this.currPage = page
                this.loadItems(this.crudResource, this.currPage, this.showItemsPerPage, this.settings, this.filters, this.searchTerm)
              }
            },
          },
        },
      )
    },
    genList (): VNode {
      return this.genListWithSlot()
    },
    genListWithSlot (): VNode {
      const slots = ['prepend-item', 'no-data', 'append-item']
        .filter(slotName => this.$slots[slotName])
        .map(slotName => this.$createElement('template', {
          slot: slotName,
        }, this.$slots[slotName]))

      const items = [
        this.$createElement(
          VCardTitle,
          {
            staticClass: 'pa-0 ma-0',
          },
          [
            this.genToolbar(),
          ],
        ),
      ]
      if (this.isLoading) {
        items.push(this.$createElement(
          VProgressLinear,
          {
            props: {
              indeterminate: true,
            },
          }
        ))
      }
      items.push(...[
        this.$createElement(
          VCardText,
          {
            staticClass: 'pa-0 ma-0 mt-1',
            staticStyle: {
              height: '200px',
              overflowY: 'scroll',
            },
          },
          [
            this.$createElement(VSelectList, {
              ...this.listData,
            }, slots),
          ]
        ),
        this.$createElement(
          VCardActions,
          {
            staticClass: 'ma-0 pa-0',
            staticStyle: {
              height: '70px',
            },
          },
          [
            this.genPagination(),
          ],
        ),
      ])

      // Requires destructuring due to Vue
      // modifying the `on` property when passed
      // as a referenced object
      return this.$createElement(
        VCard,
        {
          staticClass: 'pa-0 ma-0',
          props: {
            flat: true,
          },
        },
        items
      )
    },
  },
})
