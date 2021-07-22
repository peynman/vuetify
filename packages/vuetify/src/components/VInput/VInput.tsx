// Styles
import './VInput.sass'

// Components
import { VIcon } from '@/components/VIcon'
import VInputLabel from './VInputLabel'

// Composables
import { makeDensityProps, useDensity } from '@/composables/density'
import { makeThemeProps, useTheme } from '@/composables/theme'
import { useProxiedModel } from '@/composables/proxiedModel'

// Utilities
import { computed, ref } from 'vue'
import { convertToUnit, defineComponent, getUid } from '@/util'

// Types
import type { ComponentPublicInstance, PropType } from 'vue'

export default defineComponent({
  name: 'VInput',

  inheritAttrs: false,

  props: {
    appendIcon: String,
    backgroundColor: String,
    hideDetails: [Boolean, String] as PropType<boolean | 'auto'>,
    hideSpinButtons: Boolean,
    hint: String,
    id: String,
    label: String,
    loading: Boolean,
    modelValue: null as any as PropType<any>,
    persistentHint: Boolean,
    prependIcon: String,
    variant: {
      type: String,
      default: 'filled',
      // required: true,
    },

    ...makeThemeProps(),
    ...makeDensityProps(),
  },

  setup (props, { attrs, slots }) {
    const { themeClasses } = useTheme(props)
    const { densityClasses } = useDensity(props, 'v-input')
    const value = useProxiedModel(props, 'modelValue')
    const uid = getUid()

    const labelRef = ref<ComponentPublicInstance>()
    const prependRef = ref<HTMLElement>()
    const outlineStartRef = ref<HTMLElement>()
    const controlRef = ref<HTMLElement>()
    const isDirty = computed(() => (value.value != null && value.value !== ''))
    const isFocused = ref(false)
    const id = computed(() => props.id || `input-${uid}`)
    const translateX = ref(0)
    const translateY = ref(0)

    return () => {
      const isOutlined = props.variant === 'outlined'
      const hasPrepend = (slots.prepend || props.prependIcon)
      const hasAppend = (slots.append || props.appendIcon)
      const hasState = isFocused.value || isDirty.value
      const labelWidth = labelRef.value?.$el?.scrollWidth * (hasState ? 0.75 : 1) + 8
      const prependWidth = hasPrepend ? (prependRef.value?.scrollWidth ?? 0) + 22 : 16
      const controlRefHeight = controlRef.value?.clientHeight ?? 0

      translateX.value = 0
      translateY.value = 0

      if (props.variant === 'outlined') {
        translateX.value = (outlineStartRef.value?.offsetLeft ?? 0) - prependWidth + 16
        translateY.value = controlRefHeight / -2.15
      } else if (props.variant === 'filled') {
        translateY.value = controlRefHeight / -6
      }

      return (
        <div
          class={[
            'v-input',
            {
              'v-input--prepended': hasPrepend,
              'v-input--appended': hasAppend,
              'v-input--dirty': isDirty.value,
              'v-input--focused': isFocused.value,
              [`v-input--variant-${props.variant}`]: true,
            },
            themeClasses.value,
            densityClasses.value,
          ]}
          { ...attrs }
        >
          <div
            ref={ controlRef }
            class="v-input__control"
          >
            { hasPrepend && (
              <div
                class="v-input__prepend"
                ref={ prependRef }
              >
                { slots.prepend
                  ? slots.prepend()
                  : (<VIcon icon={ props.prependIcon } />)
                }
              </div>
            ) }

            { slots.label
              ? slots.label({
                label: props.label,
                props: { for: id.value },
              })
              : (
                <VInputLabel
                  ref={ labelRef }
                  for={ id.value }
                  active={ hasState }
                  left={ prependWidth }
                  text={ props.label }
                  translateX={ translateX.value }
                  translateY={ translateY.value }
                />
              )
            }

            <div class="v-input__field">
              { slots.default?.({
                uid,
                props: {
                  id: id.value,
                  value: value.value,
                  onFocus: () => (isFocused.value = true),
                  onBlur: () => (isFocused.value = false),
                  onInput: (e: Event) => {
                    const el = e.target as HTMLInputElement

                    value.value = el.value
                  },
                  onChange: (e: Event) => {
                    const el = e.target as HTMLInputElement

                    if (value.value === el.value) return

                    value.value = el.value
                  },
                },
              }) }
            </div>

            { hasAppend && (
              <div class="v-input__append">
                { slots.append
                  ? slots.append()
                  : (<VIcon icon={ props.appendIcon } />)
                }
              </div>
            ) }

            <div class="v-input__outline">
              { isOutlined && (
                <>
                  <div
                    class="v-input__outline__start"
                    style={{
                      width: convertToUnit((hasState ? 0 : labelWidth / 2) + 12),
                    }}
                    ref={ outlineStartRef }
                  />

                  <div
                    class="v-input__outline__notch"
                    style={{ width: convertToUnit(hasState ? labelWidth : 0) }}
                  />

                  <div class="v-input__outline__end" />
                </>
              ) }
            </div>
          </div>

          { props.hint && (
            <div class="v-input__details">
              { props.hint }
            </div>
          ) }
        </div>
      )
    }
  },
})