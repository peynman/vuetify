import mixins, { ExtractVue } from '../../util/mixins'

import { CrudColumn, CrudResource } from 'types/services/crud'

import { VTreeview } from '../VTreeview'
import { VCol, VRow } from '../VGrid'
import { VLabel } from '../VLabel'
import CrudConsumer from './CrudConsumer'
import { VNode } from 'vue/types/umd'
import { makeRandomId } from '../../util/helpers'
import { VCheckbox } from '../VCheckbox'
import { VList, VListItem, VListItemContent, VListItemTitle, VListItemGroup } from '../VList'
import { VMenu } from '../VMenu'
import { VChip } from '../VChip'

type TreeViewItem = {
  id: string
  name: string
  crud: CrudResource
  path: string
  parentPath: string
  children: TreeViewItem[]
}

type ScopedTreeViewItem = {
  item: TreeViewItem
}

const baseMixins = mixins(
  CrudConsumer
  /* @vue/component */
)
interface options extends ExtractVue<typeof baseMixins> {
  $el: HTMLElement
}

export default baseMixins.extend<options>().extend({
  name: 'v-crud-relations-list',

  inheritAttrs: false,

  props: {
    label: String,
    value: {
      type: Object,
      default: () => ({}),
    },
  },

  data () {
    return {
      internalValues: this.value,
    }
  },

  methods: {
    getItemRealColumns (item: TreeViewItem): CrudColumn[] {
      return item.crud.columns.filter((col: CrudColumn) => !col.artificial)
    },
    getRelationsTree (relations: CrudResource[]|undefined, path: string): TreeViewItem[] {
      return relations?.reduce<TreeViewItem[]>((items: any[], curr: CrudResource) => {
        const myPath = (path !== '' ? path + '.' : '') + curr.name
        items.push({
          id: curr.name + '_' + makeRandomId(5),
          name: curr.name,
          crud: curr,
          path: myPath,
          parentPath: path,
          children: this.getRelationsTree(curr.relations, myPath),
        })
        return items
      }, []) ?? []
    },
    isRelationDisabled (item: TreeViewItem): boolean {
      return !this.internalValues[item.parentPath] && item.parentPath !== ''
    },
    isRelationActive (item: TreeViewItem): boolean {
      return this.internalValues[item.path]
    },
    deActivateRelation (item: TreeViewItem) {
      this.$set(this.internalValues, item.path, undefined)
      if (item.children) {
        item.children.forEach((child: TreeViewItem) => {
          this.deActivateRelation(child)
        })
      }
    },
    getItemSelectedColumns (item: TreeViewItem): number[] {
      const actives: number[] = []
      if (this.isRelationActive(item)) {
        const columns = this.internalValues[item.path]?.split?.(',')
        if (columns?.length > 0) {
          if (columns[0] === '*') {
            return actives
          } else {
            this.getItemRealColumns(item).forEach((col: CrudColumn, index: number) => {
              if (columns?.includes(col.name)) {
                actives.push(index)
              }
            })
          }
        }
      }
      return actives
    },
    genColumnsSelectMenu (item: TreeViewItem, onChange: Function): VNode {
      return this.$createElement(
        VMenu,
        {
          props: {
            disabled: this.isRelationDisabled(item),
            closeOnContentClick: false,
          },
          scopedSlots: {
            activator: (props: any): VNode => {
              return this.$createElement(
                VChip,
                {
                  staticClass: 'mt-2 mx-2',
                  props: {
                    disabled: this.isRelationDisabled(item) || !this.isRelationActive(item),
                    dense: true,
                    rounded: true,
                    outlined: true,
                    xSmall: true,
                    color: 'secondary',
                    dark: true,
                  },
                  on: props.on,
                },
                this.internalValues?.[item.path] ?? '*'
              )
            },
          },
        },
        [
          this.$createElement(
            VList,
            {
              props: {
                dense: true,
              },
            },
            [
              this.$createElement(
                VListItemGroup,
                {
                  props: {
                    multiple: true,
                    value: this.getItemSelectedColumns(item),
                  },
                  on: {
                    change: onChange,
                  },
                },
                this.getItemRealColumns(item).map<VNode>((col: CrudColumn): VNode => {
                  return this.$createElement(
                    VListItem,
                    {
                      props: {
                        dense: true,
                      },
                    },
                    [
                      this.$createElement(
                        VListItemContent,
                        {},
                        [
                          this.$createElement(
                            VListItemTitle,
                            {},
                            col.name
                          ),
                        ],
                      ),
                    ]
                  )
                }),
              ),
            ]
          ),
        ],
      )
    },
    genRelationsTreeview (): VNode {
      return this.$createElement(
        VTreeview,
        {
          props: {
            dense: true,
            items: this.getRelationsTree(this.crudResource?.relations, ''),
          },
          scopedSlots: {
            label: (leaf: ScopedTreeViewItem): VNode => {
              return this.$createElement(
                VRow,
                {
                  props: {
                    noGutters: true,
                    align: 'center',
                  },
                },
                [
                  this.$createElement(
                    VCheckbox,
                    {
                      props: {
                        label: leaf.item.crud.name,
                        'hide-details': true,
                        dense: true,
                        disabled: this.isRelationDisabled(leaf.item),
                        inputValue: !this.isRelationDisabled(leaf.item) && this.internalValues[leaf.item.path],
                      },
                      on: {
                        change: (e: boolean) => {
                          if (e) {
                            this.$set(this.internalValues, leaf.item.path, '*')
                          } else {
                            this.deActivateRelation(leaf.item)
                          }
                          this.$emit('change', this.internalValues)
                        },
                      },
                    },
                  ),
                  this.genColumnsSelectMenu(leaf.item, (columns: number[]) => {
                    if (columns.length === 0) {
                      this.$set(this.internalValues, leaf.item.path, '*')
                    } else {
                      this.$set(
                        this.internalValues,
                        leaf.item.path,
                        this.getItemRealColumns(leaf.item)
                          .map((col: CrudColumn) => col.name)
                          .filter((name: string, index: number) => columns.includes(index)).join(',')
                      )
                    }
                  }),
                ]
              )
            },
          },
        },
      )
    },
  },

  render (h): VNode {
    return h(
      VCol,
      {
        staticClass: 'mx-0 px-0',
      },
      [
        h(
          VLabel,
          {},
          [
            this.label,
          ]
        ),
        this.genRelationsTreeview(),
      ]
    )
  },
})
