import Vue, { VNode } from 'vue'

export default Vue.extend({
  name: 'v-schema-builder-editor',

  inheritAttrs: false,

  props: {
  },

  methods: {
  },

  render (h): VNode {
    return h(
      'div',
      {
        staticClass: 'd-flex flex-row justify-space-between',
      }
    )
  },

})
