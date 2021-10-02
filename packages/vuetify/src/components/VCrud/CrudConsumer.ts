import Vue from 'vue'
import { PropValidator } from 'vue/types/options'

import { CrudResource } from 'types/services/crud'

export default Vue.extend({
  name: 'crudconsumer',

  props: {
    crud: {
      type: [Object, Function],
      default: () => ({}),
    } as PropValidator<Partial<CrudResource>>,
  },

  computed: {
    crudResource (): CrudResource|null {
      if (typeof this.crud === 'object') {
        return this.crud as CrudResource
      }

      if (typeof this.crud === 'function') {
        const crudFetcher = this.crud as Function
        return crudFetcher()
      }

      return null
    },
  },
})
