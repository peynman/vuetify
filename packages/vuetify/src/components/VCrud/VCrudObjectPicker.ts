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
      settings: {
        perPage: this.itemsPerPage,
      } as CrudTableSettings,
      filters: {} as { [key: string]: any },
    }
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
    loadItems (crud: CrudResource, page: number, limit: number, settings?: Object, filters?: Object) {
      if (this.crudLoaderFunction) {
        this.isLoading = true
        this.crudLoaderFunction(crud, page, limit, settings, filters).then((resolved: CrudQueryResult) => {
          this.isLoading = false
          this.currPageItems = resolved.items
          this.total = resolved.total
          this.currPage = resolved.currPage
        }).catch((e: any) => {
          consoleError(e)
          this.isLoading = false
        })
      }
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
        [
          this.$createElement(
            VCardTitle,
            {
              staticClass: 'pa-0 ma-0',
            },
            [
              this.$createElement(
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
                    showReload: false,
                    dense: true,
                    small: true,
                    loading: this.isLoading,
                  },
                  scopedSlots: {
                    'prepend-tools': (data: CrudToolbarScopedItem) => {
                      if (data.mode !== 'default') return ''
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
                    'change-filters': (crud: CrudResource, filters: { [key: string]: any }) => {
                      this.filters = filters
                      this.loadItems(
                        crud,
                        this.currPage,
                        this.showItemsPerPage,
                        this.settings,
                        this.filters
                      )
                    },
                    search: (crud: CrudResource, searchTerm: string, settings: CrudTableSettings, filters: Object) => {
                    },
                  },
                },
              ),
            ],
          ),
          this.$createElement(
            VCardText,
            {
              staticClass: 'pa-0 ma-0',
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
              this.$createElement(
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
                        this.loadItems(this.crudResource, this.currPage, this.showItemsPerPage, this.settings, this.filters)
                      }
                    },
                  },
                },
              ),
            ],
          ),
        ]
      )
    },
  },
})
