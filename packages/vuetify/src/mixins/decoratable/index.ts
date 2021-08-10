
import Vue, { PropType } from 'vue'
import mixins, { ExtractVue } from '../../util/mixins'

export const DecorateLabelHelper = Vue.extend({
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
    calculateLabel (
      label: string|undefined,
      decorateMap: { [key: string]: any },
      value: { [key: string]: any } | undefined): string {
      if (label && value) {
        let calcLabel = label
        Object.entries(decorateMap).forEach((entry: any[]) => {
          calcLabel = calcLabel.replace(':' + entry[0], this.getNestedValue(value, entry[1], ':' + entry[0]))
        })
        return calcLabel
      }

      return label ?? ''
    },
  },
})

const baseMixins = mixins(
  DecorateLabelHelper
  /* @vue/component */
)
interface options extends ExtractVue<typeof baseMixins> {
  $el: HTMLElement
}

export default baseMixins.extend<options>().extend({
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
    getLabelString (): string {
      return this.calculateLabel(
        this.label,
        this.decorateMap,
        this.value
      )
    },
  },
})
