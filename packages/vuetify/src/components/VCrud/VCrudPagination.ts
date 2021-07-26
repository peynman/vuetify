import mixins, { ExtractVue } from '../../util/mixins'

import Sizeable from '../../mixins/sizeable'
import CrudConsumer from './CrudConsumer'

import { VNode } from 'vue/types/umd'
import { VPagination } from '../VPagination'

const baseMixins = mixins(
  CrudConsumer,
  Sizeable
  /* @vue/component */
)
interface options extends ExtractVue<typeof baseMixins> {
  $el: HTMLElement
}

export default baseMixins.extend<options>().extend({
  name: 'v-crud-relations-list',

  inheritAttrs: false,

  props: {
    flat: Boolean,
    loading: Boolean,
    value: Number,
    pageCount: Number,
    itemsCount: Number,
    totalVisible: Number,
    total: Number,
    perPage: Number,
  },

  methods: {
    genPagination (): VNode {
      const elements = [
        this.$createElement(
          VPagination,
          {
            props: {
              disabled: this.loading,
              totalVisible: this.totalVisible,
              length: this.pageCount,
              value: this.value,
              circle: true,
            },
            on: {
              input: (e: number) => {
                this.$emit('input', e)
              },
            },
          },
        ),
      ]
      if (!this.loading) {
        elements.push(this.$createElement(
          'span',
          {
            staticClass: 'mt-1 text-caption',
          },
          this.$vuetify.lang.t('$vuetify.crud.pagination.total', this.itemsCount, this.total),
        ))
      }
      return this.$createElement(
        'div',
        {
          staticClass: 'mt-1 d-flex flex-column align-center justify-center',
        },
        elements
      )
    },
  },

  render (h): VNode {
    return this.genPagination()
  },
})
