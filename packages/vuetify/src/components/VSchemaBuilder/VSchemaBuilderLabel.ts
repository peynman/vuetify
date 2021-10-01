import Vue, { VNode } from 'vue'

import VTextField from '../VTextField'
import VBtn from '../VBtn'
import VIcon from '../VIcon'

export default Vue.extend({
  name: 'v-schema-builder-label',

  inheritAttrs: false,

  props: {
    label: {
      type: String,
      default: '',
    },
    type: {
      type: String,
      default: '',
    },
    icon: {
      type: String,
      default: '',
    },
  },
  data () {
    return {
      isLabelDirty: false,
      dirtyLabel: '',
    }
  },
  methods: {
    onSaveLabel (v: string) {
      this.$emit('change-label', v)
      this.dirtyLabel = v
      this.isLabelDirty = false
    },
    genButton (icon: string, color: string, callback: any): VNode {
      return this.$createElement(VBtn, {
        props: {
          dense: true,
          small: true,
          icon: true,
          color,
        },
        on: {
          click: callback,
        },
      }, [
        this.$createElement(VIcon, {
          props: {
            small: true,
          },
        }, [
          icon,
        ]),
      ])
    },
    genRoot (): VNode {
      if (!this.isLabelDirty) {
        this.dirtyLabel = this.label
      }
      const appends = []
      if (this.isLabelDirty) {
        appends.push(this.genButton('mdi-cancel', 'warning', (e: any) => {
          this.dirtyLabel = this.label
          this.isLabelDirty = false
        }))
        appends.push(this.genButton('mdi-content-save', 'success', (e: any) => {
          this.onSaveLabel(this.dirtyLabel)
        }))
      }

      return this.$createElement(
        'div',
        {
          staticClass: 'd-flex flex-row justify-space-between align-center',
        },
        [
          ...appends,
          this.$createElement(VTextField, {
            props: {
              dense: true,
              filled: true,
              rounded: true,
              'hide-details': true,
              value: this.dirtyLabel,
            },
            on: {
              input: (v: any) => {
                if (v && v.length > 0) {
                  this.isLabelDirty = true
                  this.dirtyLabel = v
                }
              },
              keydown: (v: KeyboardEvent) => {
                if (v.key === 'Escape' || v.key === 'Esc' || v.keyCode === 16) {
                  this.dirtyLabel = this.label
                  this.isLabelDirty = false
                } else if (v.key === 'Enter' || v.key === 'Ent' || v.keyCode === 13) {
                  this.onSaveLabel(this.dirtyLabel)
                }
              },
            },
          }),
        ]
      )
    },
  },
  render (): VNode {
    return this.genRoot()
  },

})
