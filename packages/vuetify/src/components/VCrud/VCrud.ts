import mixins, { ExtractVue } from '../../util/mixins'

import Sizeable from '../../mixins/sizeable'
import CrudConsumer from './CrudConsumer'

import { PropType, VNode } from 'vue/types/umd'
import { AsyncComponentFactory } from 'vue/types/options'
import VCol from '../VGrid/VCol'
import VCrudToolbar from './VCrudToolbar'
import VCrudTable from './VCrudTable'
import VCrudPagination from './VCrudPagination'
import { CrudQueryResult, CrudResource, CrudTableSettings, CrudUser } from 'types/services/crud'
import { consoleError } from '../../util/console'
import createApiUser from './util/createApiUser'
import { mergeDeep } from '../../util/helpers'

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
  filters?: Object,
  searchTerm?: String,
) => Promise<CrudQueryResult>

export default baseMixins.extend<options>().extend({
  name: 'v-crud',

  inheritAttrs: false,

  props: {
    items: {
      type: Function as PropType<ItemsFetchCallback> | Array<any> | undefined,
      default: undefined,
    },
    userData: {
      type: Object as PropType<any> | undefined,
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
    mode: String as PropType<VCrudMode>,
    hideEdit: Boolean,
    hideDelete: Boolean,
    id: String,
    label: String,
    dense: Boolean,
    flat: Boolean,
    totalVisible: Number,
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
    componentsDictionary: {
      type: Object as PropType<{ [key: string]: AsyncComponentFactory }>,
      default: () => ({}),
    },
  },

  data () {
    return {
      currPageItems: [] as any[],
      total: 0,
      currPage: 1,
      loading: false,
      showActionsSelect: false,
      settings: mergeDeep({}, this.valueSettings ?? {}) as CrudTableSettings,
      filters: mergeDeep({}, this.valueFilters ?? {}) as { [key: string]: any },
      selectedItems: [] as any[],
      searchTerm: undefined as String|undefined,
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
      return this.settings?.perPage?.valueOf() ?? 10
    },
    showItemSelectable (): Boolean {
      return this.showSelect === true || (this.showSelect === 'auto' && this.showActionsSelect)
    },
  },

  watch: {
    valueSettings () {
      this.settings = mergeDeep({}, this.valueSettings)
    },
    valueFilters () {
      this.filters = mergeDeep({}, this.valueFilters)
    },
  },

  methods: {
    removeItem (item: any) {
      const index = this.currPageItems.indexOf(item)
      if (index >= 0) {
        this.currPageItems.splice(index, 1)
      }
    },
    addItem (item: any) {
      this.currPageItems.unshift(item)
    },
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
            componentsDictionary: this.componentsDictionary,
            valueSettings: this.settings,
            valueSelections: this.selectedItems,
          },
          on: {
            reload: (crud: CrudResource, settings: CrudTableSettings, filters: Object, searchTerm?: String) => {
              this.filters = filters
              this.settings = settings
              this.searchTerm = searchTerm
              this.loadItems(
                crud,
                this.currPage,
                this.showItemsPerPage,
                settings,
                filters,
                searchTerm
              )
            },
            'actions-opened': (crud: CrudResource) => {
              this.showActionsSelect = true
            },
            'actions-closed': (crud: CrudResource) => {
              this.showActionsSelect = false
            },
            'reset-settings': (crud: CrudResource, callback: Function) => {
              this.$emit('reset-settings', crud, callback)
            },
            'reset-filters': (crud: CrudResource, callback: Function) => {
              this.$emit('reset-filters', crud, callback)
            },
            'save-settings': (crud: CrudResource, settings: CrudTableSettings, callback: Function) => {
              this.$emit('save-settings', crud, settings, callback)
            },
            'save-filters': (crud: CrudResource, filters: { [key: string]: any }, callback: Function) => {
              this.$emit('save-filters', crud, filters, callback)
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
            hideEdit: this.hideEdit,
            hideDelete: this.hideDelete,
            loading: this.loading,
            showSelect: this.showItemSelectable,
            tableSettings: this.settings,
            perPage: this.showItemsPerPage,
            componentsDictionary: this.componentsDictionary,
          },
          on: {
            'update-selections': (crud: CrudResource, selections: any[]) => {
              this.selectedItems = selections
            },
            edit: (item: any) => {
              this.$emit('edit', this, item)
            },
            remove: (item: any) => {
              this.$emit('remove', this, item)
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
    loadItems (crud: CrudResource, page: number, limit: number, settings?: Object, filters?: Object, searchTerm?: String) {
      if (this.items) {
        if (this.items instanceof Function) {
          this.loading = true
          this.items(crud, page, limit, settings, filters, searchTerm).then((resolved: CrudQueryResult|null) => {
            this.loading = false
            this.currPageItems = resolved?.items ?? []
            this.total = resolved?.total ?? 0
            this.currPage = resolved?.currPage ?? 0
          }).catch((e: any) => {
            consoleError(e)
            this.loading = false
          })
        } else if (Array.isArray(this.items)) {
          this.currPageItems = this.items as Array<any>
          this.total = this.currPageItems.length ?? 0
          this.currPage = 1
        }
      }
    },
    reload () {
      if (this.crudResource) {
        this.loadItems(this.crudResource, 1, this.showItemsPerPage, this.settings, this.filters, this.searchTerm)
      }
    },
    reset () {
      this.currPageItems = []
      this.total = 0
      this.currPage = 0
    },
  },

  mounted (): void {
    if (this.autoLoad && this.crudResource) {
      this.reload()
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
