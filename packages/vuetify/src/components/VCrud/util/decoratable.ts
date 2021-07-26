import Vue, { PropType } from 'vue'

export default Vue.extend({
  name: 'decoratable',

  props: {
    label: String,
    decorateMap: {
      type: Object as PropType<{ [key: string]: string }>,
      default: () => ({}),
    },
    value: {
      type: Object as PropType<{ [key: string]: any }>,
      default: () => ({}),
    },
  },

  methods: {
    getNestedValue (object: { [key: string]: any }, path: string|undefined, def: any = null): any {
      const parts = path?.split('.') ?? []
      let ref = object
      for (let index = 0; index < parts.length; index++) {
        const part = parts[index]
        if (ref[part]) {
          ref = ref[part]
        } else {
          return def
        }
      }
      return ref
    },
    getLabelString (): string {
      if (this.label) {
        let label = this.label
        Object.entries(this.decorateMap).forEach((entry: any[]) => {
          label = label.replace(':' + entry[0], this.getNestedValue(this.value, entry[1], ':' + entry[0]))
        })
        return label
      }

      return JSON.stringify(this.value)
    },
  },
})
