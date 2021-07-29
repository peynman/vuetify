import mixins, { ExtractVue } from '../../util/mixins'

import Sizeable from '../../mixins/sizeable'
import CrudConsumer from './CrudConsumer'

import { PropType, VNode } from 'vue/types/umd'
import { VCol } from '../VGrid'
import VCrudToolbar from './VCrudToolbar'
import VCrudTable from './VCrudTable'
import VCrudPagination from './VCrudPagination'
import { CrudQueryResult, CrudResource, CrudTableSettings, CrudUser } from 'types/services/crud'
import { consoleError } from '../../util/console'
import createApiUser from './util/createApiUser'

type VCrudMode = 'MANAGE' | 'QUERY';

const baseMixins = mixins(
  CrudConsumer,
  Sizeable
  /* @vue/component */
)
interface options extends ExtractVue<typeof baseMixins> {
  $el: HTMLElement
}

export type ItemsFetchCallback = (
  crud: CrudResource,
  page: number,
  limit: number,
  settings?: Object,
  filters?: Object
) => Promise<CrudQueryResult>

export default baseMixins.extend<options>().extend({
  name: 'v-crud',

  inheritAttrs: false,

  props: {
    items: {
      type: Function as PropType<ItemsFetchCallback> | Array<any>,
      default: () => ([]),
    },
    userData: {
      type: Object as PropType<any> | undefined,
      default: undefined,
    },
    mode: String as PropType<VCrudMode>,
    id: String,
    label: String,
    dense: Boolean,
    flat: Boolean,
    totalVisible: Number,
    itemsPerPage: {
      type: Number,
      default: 10,
    },
    showPagination: {
      type: Boolean,
      default: true,
    },
    showSelect: {
      type: [Boolean, String],
      default: 'auto',
    },
    autoLoad: {
      type: Boolean,
      default: true,
    },
  },

  data () {
    return {
      currPageItems: [] as any[],
      total: 0,
      currPage: 1,
      refId: 1,
      loading: false,
      showActionsSelect: false,
      settings: {
        perPage: this.itemsPerPage,
      } as CrudTableSettings,
      filters: {} as { [key: string]: any },
      selectedItems: [] as any[],
    }
  },

  computed: {
    crudUser (): CrudUser|null {
      if (this.userData) {
        return createApiUser(this.userData)
      }

      return null
    },
    showItemsPerPage (): number {
      return this.settings?.perPage?.valueOf() ?? this.itemsPerPage.valueOf()
    },
    showItemSelectable (): Boolean {
      return this.showSelect === true || (this.showSelect === 'auto' && this.showActionsSelect)
    },
  },

  methods: {
    genToolbar (): VNode {
      return this.$createElement(
        VCrudToolbar,
        {
          props: {
            crud: this.crud,
            id: this.id + '_toolbar',
            label: this.label,
            loading: this.loading,
            flat: this.flat,
            dense: this.dense,
            small: this.small,
            xSmall: this.xSmall,
            large: this.large,
            xLarge: this.xLarge,
            crudUser: this.crudUser,
            valueSettings: this.settings,
            valueSelections: this.selectedItems,
          },
          on: {
            reload: (crud: CrudResource, settings: CrudTableSettings, filters: Object) => {
              this.settings = settings
              this.filters = filters
              this.loadItems(
                crud,
                this.currPage,
                this.showItemsPerPage,
                settings,
                filters
              )
            },
            search: (crud: CrudResource, searchTerm: string, settings: CrudTableSettings, filters: Object) => {
            },
            'actions-opened': (crud: CrudResource) => {
              this.showActionsSelect = true
            },
            'actions-closed': (crud: CrudResource) => {
              this.showActionsSelect = false
            },
            'change-settings': (crud: CrudResource, settings: CrudTableSettings) => {
              this.settings = settings
              this.loadItems(
                crud,
                this.currPage,
                this.showItemsPerPage,
                this.settings,
                this.filters
              )
            },
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
            'reset-settings': (crud: CrudResource) => {
            },
            'reset-filters': (crud: CrudResource) => {
            },
            'save-settings': (crud: CrudResource, settings: CrudTableSettings, callback: Function) => {
              setTimeout(callback, 1500)
            },
            'save-filters': (crud: CrudResource, filters: { [key: string]: any }, callback: Function) => {
              setTimeout(callback, 1500)
            },
          },
        },
      )
    },
    genTable (): VNode {
      return this.$createElement(
        VCrudTable,
        {
          props: {
            crud: this.crud,
            crudUser: this.crudUser,
            items: this.currPageItems,
            loading: this.loading,
            showSelect: this.showItemSelectable,
            tableSettings: this.settings,
            perPage: this.showItemsPerPage,
          },
          on: {
            'update-selections': (crud: CrudResource, selections: any[]) => {
              this.selectedItems = selections
            },
          },
        },
      )
    },
    genPagination (): VNode {
      const pageCount = parseInt(Math.ceil(this.total / this.showItemsPerPage))
      return this.$createElement(
        VCrudPagination,
        {
          staticClass: 'mt-1',
          props: {
            loading: this.loading,
            flat: this.flat,
            totalVisible: this.totalVisible,
            total: this.total,
            pageCount,
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
      )
    },
    loadItems (crud: CrudResource, page: number, limit: number, settings?: Object, filters?: Object) {
      if (this.items instanceof Function) {
        this.loading = true
        this.items(crud, page, limit, settings, filters).then((resolved: CrudQueryResult) => {
          this.loading = false
          this.currPageItems = resolved.items
          this.total = resolved.total
          this.currPage = resolved.currPage
        }).catch((e: any) => {
          consoleError(e)
          this.loading = false
        })
      } else if (Array.isArray(this.items)) {
        this.currPageItems = this.items
        this.total = this.items.length
        this.currPage = 1
      }
    },
  },

  mounted (): void {
    if (this.autoLoad && this.crudResource) {
      this.loadItems(this.crudResource, 1, this.showItemsPerPage, this.settings, this.filters)
    }
  },

  render (h): VNode {
    return h(
      VCol,
      {},
      [
        this.genToolbar(),
        this.genTable(),
        this.showPagination ? this.genPagination() : '',
      ]
    )
  },
})
