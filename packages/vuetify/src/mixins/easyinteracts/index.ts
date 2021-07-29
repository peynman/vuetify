import Vue from 'vue'
import { VNodeChildren } from 'vue/types/vnode'
import VDialog from '../../components/VDialog'
import VMenu from '../../components/VMenu'
import VBtn from '../../components/VBtn'
import VIcon from '../../components/VIcon'
import { VNode } from 'vue/types/umd'
import { VCard, VCardTitle, VCardText } from '../../components/VCard'
import { VTooltip } from '../../components/VTooltip'

export default Vue.extend({
  name: 'easyinteracts',

  methods: {
    genTooltip (tooltip: string, activator: Function): VNode {
      return this.$createElement(
        VTooltip,
        {
          scopedSlots: {
            activator: (props: any) => {
              return activator(props.on, props.value)
            },
          },
        },
        tooltip,
      )
    },
    genActivatorCallback (onOpened: Function|null = null) {
      return {
        input: (visible: boolean) => {
          if (visible && onOpened) {
            onOpened()
          }
        },
      }
    },
    genButton (title: string, icon: string|null, color: string, onclick: Function, attrs: {[key: string]: any} = {}): VNode {
      return this.$createElement(VBtn, {
        staticClass: 'ma-auto ' + (attrs.staticClass ? attrs.staticClass : ''),
        props: {
          color,
          ...attrs,
        },
        on: {
          click: onclick,
        },
      }, [
        this.$createElement(VIcon, {
          props: (attrs.iconProps ?? {}),
        }, icon),
        title,
      ])
    },
    genIconButton (icon: string, color: string, onclick: Function, attrs: {[key: string]: any} = {}, events = {}): VNode {
      return this.$createElement(VBtn, {
        staticClass: 'ma-auto ' + (attrs.staticClass ? attrs.staticClass : ''),
        props: {
          icon: true,
          ...attrs,
        },
        on: {
          click: onclick,
          ...events,
        },
      }, [
        this.$createElement(VIcon, {
          props: {
            color,
            ...(attrs.iconProps ?? {}),
          },
        }, icon),
      ])
    },
    genDialog (
      button: string,
      icon: string,
      color: string,
      title: string,
      content: VNodeChildren,
      onOpened: Function|null = null,
      btnAttrs: {[key: string]: any} = {},
      props: {[key: string]: any} = {},
    ): VNode {
      const titleElement =
        this.$createElement(VCard, { props: { dark: true } }, [
          this.$createElement(VCardTitle, { staticClass: 'd-fixed' }, title),
        ])
      const bodyElement = this.$createElement(VCardText, {
        staticClass: 'white d-flex flex-row justify-center align-center ' + (props.staticClass ? props.staticClass : ''),
      }, content)

      return this.$createElement(
        VDialog,
        {
          props,
          scopedSlots: {
            activator: (props: any) => {
              return this.genButton(
                button, icon, color, props.on.click, btnAttrs
              )
            },
          },
          on: this.genActivatorCallback(onOpened),
        },
        [
          titleElement,
          bodyElement,
        ]
      )
    },
    genIconDialog (
      icon: string,
      color: string,
      title: string,
      content: VNodeChildren,
      onOpened: Function|null = null,
      btnAttrs: {[key: string]: any} = {},
    ): VNode {
      const titleElement =
        this.$createElement(VCard, { props: { dark: true } }, [
          this.$createElement(VCardTitle, { staticClass: 'd-fixed' }, title),
        ])
      const bodyElement = this.$createElement(VCardText, {
        staticClass: 'white d-flex flex-row justify-center align-center',
      }, content)

      return this.$createElement(
        VDialog,
        {
          props: {
          },
          scopedSlots: {
            activator: (props: any) => {
              return this.genIconButton(
                icon, color, props.on.click, btnAttrs
              )
            },
          },
          on: this.genActivatorCallback(onOpened),
        },
        [
          titleElement,
          bodyElement,
        ]
      )
    },
    genMenu (
      icon: string,
      color: string,
      title: string,
      content: VNodeChildren,
      onOpened: Function|null = null,
      props: {[key: string]: any} = {},
      btnProps: {[key: string]: any} = {}): VNode {
      const bodyElement = this.$createElement(VCardText, {
        staticClass: 'overflow-y-auto',
        staticStyle: {
          'max-height': '300px',
        },
      }, content)

      const titleElement = this.$createElement(VCard, {}, [
        this.$createElement(VCardTitle, { props: { dense: true, small: true } }, title),
        bodyElement,
      ])
      return this.$createElement(
        VMenu,
        {
          props,
          scopedSlots: {
            activator: (props: any) => {
              return this.genIconButton(
                icon, color, props.on.click, btnProps
              )
            },
          },
          on: this.genActivatorCallback(onOpened),
        },
        [
          titleElement,
        ]
      )
    },
    genRemoveItemMenuContent (onRemove: Function): VNode[] {
      return [
        this.genIconButton('mdi-check', 'success', onRemove, {
          icon: false,
          depressed: true,
          color: 'red',
          dark: true,
          'x-small': false,
          iconProps: {
            color: 'white',
            'x-small': false,
          },
        }),
        this.genIconButton('mdi-cancel', 'secondary', () => {
        }, {
          icon: false,
          depressed: true,
          color: 'primary',
          dark: true,
          'x-small': false,
          iconProps: {
            color: 'white',
            'x-small': false,
          },
        }),
      ]
    },
  },
})
