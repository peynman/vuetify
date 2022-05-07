import Vue, { PropType } from 'vue'
import mixins, { ExtractVue } from '../../util/mixins'
import { AsyncComponentFactory } from 'vue/types/options'
import Sizeable from '../../mixins/sizeable'
import CrudConsumer from './CrudConsumer'
import EasyInteracts from '../../mixins/easyinteracts'
import { CrudAction, CrudColumn, ApiMethod, CrudResource, CrudTableSettings, CrudUser } from 'types/services/crud'
import { VNode } from 'vue/types/umd'
import { mergeDeep } from '../../util/helpers'
import { SchemaRendererAgent } from 'types/services/schemas'

import VToolbar from '../VToolbar/VToolbar'
import VBtn from '../VBtn/VBtn'
import VIcon from '../VIcon/VIcon'
import VDivider from '../VDivider/VDivider'
import VLabel from '../VLabel/VLabel'
import VSpacer from '../VGrid/VSpacer'
import VCol from '../VGrid/VCol'
import VTextField from '../VTextField/VTextField'
import VDialog from '../VDialog/VDialog'
import { VCard, VCardActions, VCardText, VCardTitle } from '../VCard'
import VSelect from '../VSelect/VSelect'
import VCheckbox from '../VCheckbox/VCheckbox'
import VTab from '../VTabs/VTab'
import VTabsSlider from '../VTabs/VTabsSlider'
import VTabs from '../VTabs/VTabs'
import VCrudRelationsList from './VCrudRelationsList'
import VCrudApiForm from './VCrudApiForm'
import VBtnToggle from '../VBtnToggle/VBtnToggle'

const baseMixins = mixins(
  EasyInteracts,
  CrudConsumer,
  Sizeable
  /* @vue/component */
)
interface options extends ExtractVue<typeof baseMixins> {
  $el: HTMLElement
}

export interface CrudToolbarScopedItem {
  crud?: CrudResource
  user?: CrudUser
  filters: { [key: string]: any }
  settings: { [key: string]: any }
  search: String
  mode: String
}

export default baseMixins.extend<options>().extend({
  name: 'v-crud-toolbar',

  inheritAttrs: false,

  props: {
    id: String,
    label: String,
    loading: Boolean,
    dense: Boolean,
    flat: Boolean,
    showCreate: {
      type: [Boolean, String],
      default: 'auto',
    },
    showExport: {
      type: [Boolean, String],
      default: 'auto',
    },
    showActions: {
      type: [Boolean, String],
      default: 'auto',
    },
    showFilters: {
      type: [Boolean, String],
      default: 'auto',
    },
    showSettings: {
      type: Boolean,
      default: true,
    },
    showReload: {
      type: Boolean,
      default: true,
    },
    showSearch: {
      type: Boolean,
      default: true,
    },
    dialogProps: {
      type: Object,
      default: () => ({
        maxWidth: 766,
      }),
    },
    crudUser: {
      type: Object as PropType<CrudUser> | undefined,
      default: undefined,
    },
    componentsDictionary: {
      type: Object as PropType<{ [key: string]: AsyncComponentFactory }>,
      default: () => ({}),
    },
    valueSettings: {
      type: Object as PropType<CrudTableSettings>,
      default: () => ({}),
    },
    valueFilters: {
      type: Object as PropType<{ [key: string]: any }>,
      default: () => ({}),
    },
    valueSelections: {
      type: Array,
      default: () => ([]),
    },
  },

  data () {
    return {
      toolbarMode: 'default',
      searchTerm: '',
      expandMode: '',
      settingsDialog: false,
      filtersDialog: false,
      createDialog: false,
      savingSettings: false,
      savingFilters: false,
      actionsTab: 0,
      actionFormValue: {} as { [key: string]: any },
      filtersFormValue: mergeDeep({}, this.valueFilters ?? {}) as { [key: string]: any },
      settingsFormValue: mergeDeep({}, this.valueSettings ?? {}) as CrudTableSettings,
    }
  },

  computed: {
    sizableProps (): Object {
      return {
        small: this.small,
        'x-small': this.xSmall,
        large: this.large,
        'x-large': this.xLarge,
      }
    },
    canChangeSettings (): Boolean {
      return this.showSettings
    },
    canCreateNew (): Boolean {
      const hasCreatePermission = (this.crudResource?.api?.create &&
        this.crudUser?.hasAccessToApiMethod(this.crudResource?.api?.create)) ?? false
      return this.showCreate === true || (this.showCreate === 'auto' && hasCreatePermission)
    },
    canExport (): Boolean {
      const hasExportPermission = (this.crudResource?.api?.export && this.crudResource.exportableColumns &&
        this.crudUser?.hasAccessToApiMethod(this.crudResource?.api?.export)) ?? false
      return this.showExport === true || (this.showExport === 'auto' && hasExportPermission)
    },
    hasActions (): Boolean {
      return (Object.keys(this.crudResource?.actions ?? {})
        .filter((ak: string) => this.crudResource?.actions?.[ak].batched).length ?? 0) > 0 && this.showActions !== false
    },
    hasFilters (): Boolean {
      return (this.crudResource?.api?.query?.form?.length ?? 0) > 0 && this.showFilters !== false
    },
    itemsPerPageOptions (): Object[] {
      return [5, 10, 15, 30, 50, 100].map(n => ({
        text: n.toString(),
        value: n,
      }))
    },
    isSearchMode (): Boolean {
      return this.toolbarMode === 'search'
    },
    extendedActions (): CrudAction[] {
      return Object.keys(this.crudResource?.actions ?? {})
        .filter((name: string) => this.crudResource?.actions?.[name].api)
        .filter((name: string) => {
          return this.crudResource?.actions?.[name].batched && (
            !this.crudUser || this.crudUser?.hasAccessToApiMethod(this.crudResource?.actions[name].api as ApiMethod)
          )
        })
        .map((name: string) => (this.crudResource?.actions?.[name])) as CrudAction[]
    },
    currentExtendedAction (): CrudAction|undefined {
      return this.crudResource?.actions?.[this.currentExtendedActionName]
    },
    currentExtendedActionName (): string {
      return Object.keys(this.crudResource?.actions ?? {})[this.actionsTab]
    },
  },

  watch: {
    valueSettings () {
      this.settingsFormValue = mergeDeep({}, this.valueSettings)
    },
    valueFilters () {
      this.filtersFormValue = mergeDeep({}, this.valueFilters)
    },
  },

  methods: {
    emitReload (search: any = null) {
      this.$emit('reload', this.crudResource, this.settingsFormValue, this.filtersFormValue, search)
    },
    genDialog (activator: Function, visible: boolean, onVisibleChanged: Function, content: VNode[], props = {}): VNode {
      return this.$createElement(
        VDialog,
        {
          props: {
            value: visible,
            ...props,
            ...(this.dialogProps ?? {}),
          },
          scopedSlots: {
            activator: (props: any) => {
              return activator(props)
            },
          },
          on: {
            input: (visible: boolean) => {
              if (onVisibleChanged) {
                onVisibleChanged(visible)
              }
              if (!visible) {
                this.expandMode = ''
              }
            },
          },
        },
        content
      )
    },
    genFormCard (title: string, content: VNode[], actions: VNode[]): VNode {
      return this.$createElement(
        VCard,
        {
        },
        [
          this.$createElement(
            VCardTitle,
            {},
            title,
          ),
          this.$createElement(
            VDivider,
            {}
          ),
          this.$createElement(
            VCardText,
            {
              staticClass: 'mt-5',
            },
            content,
          ),
          this.$createElement(
            VDivider,
            {}
          ),
          this.$createElement(
            VCardActions,
            {},
            actions,
          ),
        ]
      )
    },
    genCreateForm (): VNode {
      return this.$createElement(
        VCrudApiForm,
        {
          props: {
            crud: this.crudResource,
            api: 'create',
            crudUser: this.crudUser,
            componentsDictionary: this.componentsDictionary,
          },
        }
      )
    },
    genFiltersForm (): VNode {
      return this.$createElement(
        VCrudApiForm,
        {
          props: {
            crud: this.crudResource,
            crudUser: this.crudUser,
            componentsDictionary: this.componentsDictionary,
            api: 'query',
            extraActions: [
              {
                tag: 'VBtn',
                props: {
                  color: 'primary',
                  dense: true,
                  dark: true,
                },
                on: {
                  click: (renderer: SchemaRendererAgent) => {
                    this.filtersFormValue = renderer.getBindingValues()
                    this.emitReload()
                  },
                },
                children: this.$vuetify.lang.t('$vuetify.crud.toolbar.filters.reload'),
              },
              {
                tag: 'VSpacer',
              },
              {
                tag: 'VBtn',
                props: {
                  color: 'secondary',
                  dense: true,
                  dark: true,
                  loading: this.savingFilters,
                },
                on: {
                  click: () => {
                    this.savingFilters = true
                    this.$emit('save-filters', this.crudResource, this.filtersFormValue, () => {
                      this.savingFilters = false
                      this.expandMode = ''
                    })
                  },
                },
                children: this.$vuetify.lang.t('$vuetify.crud.toolbar.filters.save'),
              },
              {
                tag: 'VBtn',
                props: {
                  color: 'secondary',
                  dense: true,
                  dark: true,
                  disabled: this.savingFilters,
                },
                on: {
                  click: () => {
                    this.$emit('reset-filters', this.crudResource, (filters: { [key: string]: any }) => {
                      this.filtersFormValue = filters
                      this.expandMode = ''
                    })
                  },
                },
                children: this.$vuetify.lang.t('$vuetify.crud.toolbar.filters.reset'),
              },
            ],
          },
        },
      )
    },
    genSettingsForm (): VNode {
      return this.genFormCard(this.$vuetify.lang.t('$vuetify.crud.toolbar.settings.title'), [
        this.$createElement(
          VSelect,
          {
            props: {
              label: this.$vuetify.lang.t('$vuetify.crud.toolbar.settings.itemsPerPage'),
              dense: true,
              value: this.settingsFormValue.perPage,
              items: this.itemsPerPageOptions,
              'hide-details': true,
            },
            on: {
              change: (e: any) => {
                this.$set(this.settingsFormValue, 'perPage', e)
              },
            },
          }
        ),
        this.$createElement(
          'div',
          {
            staticClass: 'd-flex flex-row align-center',
          },
          [
            this.$createElement(
              VSelect,
              {
                props: {
                  label: this.$vuetify.lang.t('$vuetify.crud.toolbar.settings.sortBy'),
                  items: this.crud.columns?.filter((c: CrudColumn) => c.sortable).map((c: CrudColumn) => ({
                    text: c.title,
                    value: c.name,
                  })),
                  value: this.settingsFormValue.sortBy,
                  clearable: true,
                },
                on: {
                  change: (e: any) => {
                    this.$set(this.settingsFormValue, 'sortBy', e)
                  },
                },
              },
            ),
            this.$createElement(
              VBtnToggle,
              {
                staticClass: 'ms-2',
                props: {
                  value: this.settingsFormValue.sortDesc ? 1 : 0,
                  dense: true,
                },
                on: {
                  change: (e: any) => {
                    this.$set(this.settingsFormValue, 'sortDesc', e)
                  },
                },
              },
              [
                this.$createElement(
                  VBtn,
                  {
                    props: {
                      dense: true,
                      small: true,
                    },
                  },
                  this.$vuetify.lang.t('$vuetify.crud.toolbar.settings.sortAsc')
                ),
                this.$createElement(
                  VBtn,
                  {
                    props: {
                      dense: true,
                      small: true,
                    },
                  },
                  this.$vuetify.lang.t('$vuetify.crud.toolbar.settings.sortDesc')
                ),
              ]
            ),
          ]
        ),
        this.$createElement(
          VCol,
          {
            staticClass: 'mx-0 px-0',
          },
          [
            this.$createElement(
              VLabel,
              {
              },
              this.$vuetify.lang.t('$vuetify.crud.toolbar.settings.hideColumns'),
            ),
            this.$createElement(
              'div',
              {
                staticClass: 'd-flex flex-row flex-wrap justify-start align-center',
              },
              this.crudResource?.columns?.map<VNode>((col: CrudColumn) => {
                return this.$createElement(
                  VCheckbox,
                  {
                    staticClass: 'ms-5',
                    props: {
                      dense: true,
                      label: col.title,
                      inputValue: this.settingsFormValue.hideColumns?.includes(col.name),
                      'hide-details': true,
                    },
                    on: {
                      change: (c: boolean) => {
                        if (!this.settingsFormValue.hideColumns) {
                          this.$set(this.settingsFormValue, 'hideColumns', [])
                        }
                        if (c && !this.settingsFormValue.hideColumns?.includes(col.name)) {
                          this.settingsFormValue.hideColumns?.push(col.name)
                        } else if (!c) {
                          const index = this.settingsFormValue.hideColumns?.indexOf(col.name) ?? -1
                          if (index >= 0) {
                            this.settingsFormValue.hideColumns?.splice(index, 1)
                          }
                        }
                      },
                    },
                  }
                )
              }) ?? [],
            ),
          ]
        ),
        this.$createElement(
          VCrudRelationsList,
          {
            props: {
              crud: this.crudResource,
              label: this.$vuetify.lang.t('$vuetify.crud.toolbar.settings.loadRelations'),
              value: this.settingsFormValue.loadRelations,
            },
            on: {
              change: (relations: any) => {
                this.$set(this.settingsFormValue, 'loadRelations', relations)
              },
            },
          },
        ),
        this.$createElement(
          VCheckbox,
          {
            props: {
              label: this.$vuetify.lang.t('$vuetify.crud.toolbar.settings.includeTrashed'),
              inputValue: this.settingsFormValue.includeTrashed,
            },
            on: {
              change: (e: boolean) => {
                this.$set(this.settingsFormValue, 'includeTrashed', e)
              },
            },
          },
        ),
      ], [
        this.$createElement(
          VBtn,
          {
            props: {
              color: 'primary',
              dense: true,
              dark: true,
            },
            on: {
              click: () => {
                this.settingsDialog = false
                this.expandMode = ''
                this.emitReload()
              },
            },
          },
          this.$vuetify.lang.t('$vuetify.crud.toolbar.settings.reload'),
        ),
        this.$createElement(
          VSpacer,
        ),

        this.$createElement(
          VBtn,
          {
            props: {
              color: 'secondary',
              dense: true,
              dark: true,
              loading: this.savingSettings,
              disabled: this.savingSettings,
            },
            on: {
              click: () => {
                this.savingSettings = true
                this.$emit('save-settings', this.crudResource, this.settingsFormValue, () => {
                  this.savingSettings = false
                  this.expandMode = ''
                })
              },
            },
          },
          this.$vuetify.lang.t('$vuetify.crud.toolbar.settings.save'),
        ),
        this.$createElement(
          VBtn,
          {
            props: {
              color: 'secondary',
              dense: true,
              dark: true,
              disabled: this.savingSettings,
            },
            on: {
              click: () => {
                this.$emit('reset-settings', this.crudResource, (settings: { [key: string]: any }) => {
                  this.expandMode = ''
                  this.settingsFormValue = settings
                })
              },
            },
          },
          this.$vuetify.lang.t('$vuetify.crud.toolbar.settings.reset'),
        ),
      ])
    },
    genExtendedForms (): VNode {
      return this.$createElement(
        VCrudApiForm,
        {
          props: {
            crud: this.crudResource,
            api: this.currentExtendedActionName,
            isAction: true,
            crudUser: this.crudUser,
            componentsDictionary: this.componentsDictionary,
            extraBindings: [
              {
                name: 'selections',
                type: 'default',
                default: this.valueSelections,
              },
            ],
          },
        }
      )
    },
    getActionsToolbarButton (): VNode {
      return this.genTooltip(
        this.$vuetify.lang.t('$vuetify.crud.toolbar.actions.tooltip'),
        (on: any) => this.genIconButton(
          this.expandMode === 'actions' ? 'mdi-close' : 'mdi-form-textbox',
          this.expandMode === 'actions' ? 'warning' : 'secondary',
          () => {
            this.expandMode = this.expandMode === 'actions' ? '' : 'actions'
            if (this.toolbarMode === 'actions') {
              this.toolbarMode = 'default'
              this.$emit('actions-closed', this.crudResource)
            } else {
              this.toolbarMode = 'actions'
              this.$emit('actions-opened', this.crudResource)
            }
          },
          {
            ...this.sizableProps,
            iconProps: {
              ...this.sizableProps,
            },
          })
      )
    },
    getSearchToolbarButton (): VNode {
      return this.genTooltip(
        this.$vuetify.lang.t('$vuetify.crud.toolbar.search.tooltip'),
        (on: any, value: boolean) => this.genIconButton(this.isSearchMode ? 'mdi-close' : 'mdi-magnify', this.isSearchMode ? 'warning' : 'secondary',
          () => {
            if (!this.isSearchMode) {
              this.toolbarMode = 'search'
              setTimeout(() => {
                const searchInput = this.$refs.searchInput as Vue
                if (searchInput) {
                  const searchElement = searchInput.$el
                  const input = searchElement.querySelector('input:not([type=hidden]),textarea:not([type=hidden])') as HTMLElement
                  if (input) {
                    setTimeout(() => {
                      input.focus()
                    }, 0)
                  }
                }
              }, 100)
            } else {
              this.toolbarMode = 'default'
            }
          },
          {
            ...this.sizableProps,
            iconProps: {
              ...this.sizableProps,
            },
          },
          on))
    },
    getSearchToolbarTools (): VNode[] {
      return [
        this.$createElement(
          VTextField,
          {
            ref: 'searchInput',
            props: {
              dense: this.dense,
              value: this.searchTerm,
              'hide-details': true,
            },
            on: {
              change: (s: string) => {
                this.searchTerm = s
              },
              input: (s: string) => {
                this.searchTerm = s
              },
              keydown: (e: KeyboardEvent) => {
                if (e.key === 'Enter' && this.searchTerm && this.searchTerm.length > 1) {
                  this.emitReload(this.searchTerm)
                }
              },
            },
          },
        ),
      ]
    },
    getCommonToolbarTools (): VNode[] {
      const toolbarTools = []

      if (this.showReload) {
        toolbarTools.unshift(
          this.genTooltip(
            this.$vuetify.lang.t('$vuetify.crud.toolbar.reload.tooltip'),
            (on: any) =>
              this.genIconButton('mdi-refresh', 'secondary',
                () => {
                  this.emitReload()
                },
                {
                  loading: this.loading,
                  ...this.sizableProps,
                  iconProps: {
                    ...this.sizableProps,
                  },
                }, on)
          ),
          this.$createElement(
            VDivider,
            {
              staticClass: 'mx-1',
              props: {
                vertical: true,
                inset: true,
              },
            },
          ),
        )
      }

      toolbarTools.push(
        ...[
          this.$createElement(
            VLabel,
            {
              staticClass: 'ms-1',
            },
            [
              this.label,
            ],
          ),
          this.$createElement(
            VSpacer,
            {},
          ),
        ]
      )
      if (this.hasFilters || this.hasActions || this.canCreateNew || this.canChangeSettings) {
        toolbarTools.push(
          this.$createElement(
            VDivider,
            {
              staticClass: 'mx-1',
              props: {
                vertical: true,
                inset: true,
              },
            },
          )
        )
      }
      if (this.canCreateNew) {
        toolbarTools.push(
          // create
          this.genDialog(
            (props: any) => {
              return this.genTooltip(
                this.$vuetify.lang.t('$vuetify.crud.toolbar.create.tooltip'),
                (on: any) => this.genIconButton(
                  this.expandMode === 'create' ? 'mdi-close' : 'mdi-plus-box',
                  this.expandMode === 'create' ? 'warning' : 'green',
                  (e: MouseEvent) => {
                    e.preventDefault()
                    this.expandMode = this.expandMode === 'create' ? '' : 'create'
                    props.on.click(e)
                  }, {
                    ...this.sizableProps,
                    to: this.crud.api?.create?.to,
                    href: this.crud.api?.create?.href,
                    iconProps: {
                      ...this.sizableProps,
                    },
                  }, on)
              )
            },
            this.createDialog,
            (visible: boolean) => {
              this.createDialog = visible
            },
            [
              this.genCreateForm(),
            ],
            {
            }
          ),
        )
      }
      if (this.hasFilters) {
        toolbarTools.push(
          // filters
          this.genDialog(
            (props: any) => {
              return this.genTooltip(
                this.$vuetify.lang.t('$vuetify.crud.toolbar.filters.tooltip'),
                (on: any) => this.genIconButton(
                  this.expandMode === 'filters' ? 'mdi-close' : 'mdi-filter',
                  this.expandMode === 'filters' ? 'warning' : 'secondary',
                  (e: any) => {
                    this.expandMode = this.expandMode === 'filters' ? '' : 'filters'
                    props.on.click(e)
                  }, {
                    ...this.sizableProps,
                    iconProps: {
                      ...this.sizableProps,
                    },
                  }, on))
            },
            this.filtersDialog,
            (visible: boolean) => {
              this.filtersDialog = visible
            },
            [
              this.genFiltersForm(),
            ],
            {
            }
          ),
        )
      }
      if (this.canChangeSettings) {
        toolbarTools.push(
          // settings
          this.genDialog(
            (props: any) => {
              return this.genTooltip(
                this.$vuetify.lang.t('$vuetify.crud.toolbar.settings.tooltip'),
                (on: any) => this.genIconButton(
                  this.expandMode === 'settings' ? 'mdi-close' : 'mdi-cog',
                  this.expandMode === 'settings' ? 'warning' : 'secondary',
                  (e: any) => {
                    this.expandMode = this.expandMode === 'settings' ? '' : 'settings'
                    props.on.click(e)
                  }, {
                    ...this.sizableProps,
                    iconProps: {
                      ...this.sizableProps,
                    },
                  }, on)
              )
            },
            this.settingsDialog,
            (visible: boolean) => {
              this.settingsDialog = visible
            },
            [
              this.genSettingsForm(),
            ],
            {
            }
          ),
        )
      }
      if (this.hasActions) {
        toolbarTools.push(
          // actions
          this.getActionsToolbarButton()
        )
      }
      return toolbarTools
    },
    getActionsToolbar (): VNode[] {
      return [
        this.$createElement(
          VTabs,
          {
            props: {
              value: this.actionsTab,
            },
            on: {
              change: (tab: number) => {
                this.actionsTab = tab
              },
            },
          },
          [
            this.$createElement(
              VTabsSlider,
            ),
            this.extendedActions.map<VNode>((act: CrudAction) => {
              return this.$createElement(
                VTab,
                {},
                [
                  act.icon ? this.$createElement(
                    VIcon,
                    {
                      staticClass: 'me-2',
                      props: {
                        small: true,
                      },
                    },
                    act.icon
                  ) : '',
                  typeof act.title === 'function' ? act.title(this, this.crudResource, act) : act.title,
                ]
              )
            }),
          ]
        ),
        this.getActionsToolbarButton(),
      ]
    },
    genToolbar (): VNode {
      const toolbarTools = []
      if (this.$scopedSlots['prepend-tools']) {
        toolbarTools.push(this.$scopedSlots['prepend-tools']({
          crud: this.crudResource,
          user: this.crudUser,
          settings: this.settingsFormValue,
          filters: this.filtersFormValue,
          search: this.searchTerm,
          mode: this.toolbarMode,
        } as CrudToolbarScopedItem))
      }
      if (this.showSearch && this.toolbarMode !== 'actions') {
        toolbarTools.push(this.getSearchToolbarButton())
      }
      if (this.toolbarMode === 'search') {
        toolbarTools.push(...this.getSearchToolbarTools())
      } else if (this.toolbarMode === 'actions') {
        toolbarTools.push(...this.getActionsToolbar())
      } else {
        toolbarTools.push(...this.getCommonToolbarTools())
      }

      return this.$createElement(VToolbar,
        {
          staticClass: '',
          props: {
            flat: this.flat,
            dense: this.dense,
          },
        },
        toolbarTools,
      )
    },
  },

  render (h): VNode {
    return h(
      'div',
      {
        staticClass: 'd-flex flex-column',
      },
      [
        this.genToolbar(),
        this.toolbarMode === 'actions' ? this.genExtendedForms() : '',
      ])
  },
})
