import { PropType, VNode } from 'vue'
import mixins, { ExtractVue } from '../../util/mixins'

import Sizeable from '../../mixins/sizeable'
import CrudConsumer from './CrudConsumer'
import { VDataTable } from '../VDataTable'
import { CrudAction, CrudColumn, CrudTableSettings, CrudUser } from 'types/services/crud'
import { DataTableHeader } from 'types'
import VSchemaRenderer from '../VSchemaRenderer'
import { VBtn } from '../VBtn'
import { VIcon } from '../VIcon'

type ScopedItem = {
  isMobile: boolean
  item: any
  header: DataTableHeader
  value: any
}

type SelectionChange = {
  item: any
  value: boolean
}

// type ScopedAction = {
//   expand: (v: boolean) => void
//   index: number
//   item: any
//   isExpanded: boolean
//   isMobile: boolean
//   isSelected: boolean
//   select: (v: boolean) => void
//   headers: DataTableHeader[]
// }

// type ScopedHeader = {
//   isMobile: boolean
//   props: {
//     value: boolean
//     indeterminate: boolean
//   }
//   on: {
//     input: (value: boolean) => void
//   }
// }

const baseMixins = mixins(
  CrudConsumer,
  Sizeable
  /* @vue/component */
)
interface options extends ExtractVue<typeof baseMixins> {
  $el: HTMLElement
}

export default baseMixins.extend<options>().extend({
  name: 'v-crud-table',

  inheritAttrs: false,

  props: {
    items: {
      type: Array,
      default: () => ([]),
    },
    perPage: Number,
    loading: Boolean,
    showSelect: Boolean,
    showQuickSearch: Boolean,
    tableSettings: {
      type: Object as PropType<CrudTableSettings> | undefined,
      default: undefined,
    },
    crudUser: {
      type: Object as PropType<CrudUser> | undefined,
      default: undefined,
    },
  },

  data () {
    return {
      selectedItems: [] as any[],
    }
  },

  computed: {
    showActions (): Boolean {
      return this.singleItemActions.length > 0 || this.showEdit || this.showDelete
    },
    showDelete (): Boolean {
      if (this.crudResource?.api?.delete?.permission) {
        return this.crudUser?.hasAccessToApiMethod(this.crudResource?.api?.delete)
      }
      return false
    },
    showEdit (): Boolean {
      if (this.crudResource?.api?.edit?.permission) {
        return this.crudUser?.hasAccessToApiMethod(this.crudResource?.api?.edit)
      }
      return false
    },
    singleItemActions (): CrudAction[] {
      return this.crudResource?.actions?.filter((
        act: CrudAction) => !act.batched && this.crudUser?.hasAccessToApiMethod(act.api)
      ) ?? []
    },
  },

  methods: {
    onEditItem (item: any) {
    },
    onRemoveItem (item: any) {
    },
    updateScopedColumnsAndHeaders (headers: DataTableHeader[], scopedSlots: { [key: string]: any }) {
      this.crudResource?.columns.forEach((col: CrudColumn) => {
        if (this.tableSettings?.hideColumns?.includes(col.name)) {
          return
        }

        headers.push({
          text: col.title,
          value: col.name,
          sortable: col.sortable,
        })
        scopedSlots['item.' + col.name] = (scopedItem: ScopedItem) => {
          if (col.component) {
            return this.$createElement(
              VSchemaRenderer,
              {
                props: {
                  bindings: [
                    {
                      name: 'item',
                      type: 'JSON',
                      default: scopedItem.item,
                    },
                    {
                      name: 'column',
                      type: 'JSON',
                      default: col,
                    },
                  ],
                  schema: col.component,
                },
              },
            )
          }

          return scopedItem.item[col.name]
        }
      })

      if (this.showActions) {
        headers.push({
          text: '',
          value: 'actions',
          sortable: false,
        })

        scopedSlots['item.actions'] = (scopedItem: ScopedItem) => {
          const actions: VNode[] = [
            ...this.singleItemActions.map((act: CrudAction) => {
              return this.$createElement(
                VBtn,
                {
                  props: {
                    icon: true,
                    small: true,
                  },
                },
                [
                  this.$createElement(
                    VIcon,
                    {
                      props: {
                        small: true,
                      },
                    },
                    act.icon ?? 'mdi-content-save-edit-outline',
                  ),
                ]
              )
            }),
          ]

          if (this.showDelete) {
            actions.push(
              this.$createElement(
                VBtn,
                {
                  props: {
                    icon: true,
                    small: true,
                    color: 'red',
                  },
                  on: {
                    click: () => {
                      this.onRemoveItem(scopedItem.item)
                    },
                  },
                },
                [
                  this.$createElement(
                    VIcon,
                    {
                      props: {
                        small: true,
                        color: 'red',
                      },
                    },
                    'mdi-database-remove',
                  ),
                ]
              )
            )
          }
          if (this.showEdit) {
            actions.push(
              this.$createElement(
                VBtn,
                {
                  props: {
                    icon: true,
                    small: true,
                    color: 'secondary',
                  },
                  on: {
                    click: () => {
                      this.onEditItem(scopedItem.item)
                    },
                  },
                },
                [
                  this.$createElement(
                    VIcon,
                    {
                      props: {
                        small: true,
                        color: 'secondary',
                      },
                    },
                    'mdi-database-edit',
                  ),
                ]
              )
            )
          }

          return this.$createElement(
            'div',
            {
              staticClass: 'd-flex flex-row flex-wrap align-center justify-center',
            },
            actions
          )
        }
      }
    },
  },

  render (h): VNode {
    const headers = [] as DataTableHeader[]
    const scopedSlots = {} as { [key: string]: any }

    this.updateScopedColumnsAndHeaders(headers, scopedSlots)

    return this.$createElement(
      VDataTable,
      {
        props: {
          items: this.items,
          loading: this.loading,
          hideDefaultFooter: true,
          headers,
          showSelect: this.showSelect,
          calculateWidths: true,
          itemsPerPage: this.perPage,
        },
        on: {
          'item-selected': (selection: SelectionChange) => {
            if (!this.selectedItems.includes(selection.item) && selection.value) {
              this.selectedItems.push(selection.item)
            } else if (this.selectedItems.includes(selection.item) && !selection.value) {
              const index = this.selectedItems.indexOf(selection.item)
              if (index >= 0) {
                this.selectedItems.splice(index, 1)
              }
            }
            this.$emit('update-selections', this.crudResource, this.selectedItems)
          },
        },
        scopedSlots,
      },
    )
  },
})
