import Vue, { PropType } from 'vue'
import mixins, { ExtractVue } from '../../util/mixins'

import Sizeable from '../../mixins/sizeable'
import CrudConsumer from './CrudConsumer'

import { CrudAction, CrudColumn, CrudFormInput, CrudTableSettings, CrudUser } from 'types/services/crud'
import { VToolbar } from '../VToolbar'
import { VNode } from 'vue/types/umd'
import { VBtn } from '../VBtn'
import { VIcon } from '../VIcon'
import { VDivider } from '../VDivider'
import { VLabel } from '../VLabel'
import { VSpacer, VCol } from '../VGrid'
import { VTextField } from '../VTextField'
import { VDialog } from '../VDialog'
import { VCard, VCardActions, VCardText, VCardTitle } from '../VCard'
import { VSelect } from '../VSelect'
import { VCheckbox } from '../VCheckbox'

import VCrudRelationsList from './VCrudRelationsList'
import { VTab, VTabs, VTabsSlider } from '../VTabs'
import VSchemaRenderer from '../VSchemaRenderer'
import { ScehmaRendererBinding, SchemaRendererAgent, SchemaRendererComponent } from 'types/services/schemas'

const baseMixins = mixins(
  CrudConsumer,
  Sizeable
  /* @vue/component */
)
interface options extends ExtractVue<typeof baseMixins> {
  $el: HTMLElement
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
    crudUser: {
      type: Object as PropType<CrudUser> | undefined,
      default: undefined,
    },
    valueSettings: {
      type: Object as PropType<CrudTableSettings>,
      default: () => ({}),
    },
    valueFilters: {
      type: Object as PropType<CrudTableSettings>,
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
      filtersForm: { ...this.valueFilters },
      settingsForm: { ...this.valueSettings } as CrudTableSettings,
      expandMode: '',
      settingsDialog: false,
      filtersDialog: false,
      createDialog: false,
      savingSettings: false,
      savingFilters: false,
      actionsTab: 0,
      actionFormValue: {} as { [key: string]: any },
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
      return this.crudResource?.actions !== null
    },
    hasFilters (): Boolean {
      return this.crudResource?.filtersForm !== null
    },
    itemsPerPageOptions (): Object[] {
      return [
        {
          text: '5',
          value: 5,
        },
        {
          text: '10',
          value: 10,
        },
        {
          text: '15',
          value: 15,
        },
        {
          text: '30',
          value: 30,
        },
        {
          text: '50',
          value: 50,
        },
        {
          text: '100',
          value: 100,
        },
      ]
    },
    searchMode (): Boolean {
      return this.toolbarMode === 'search'
    },
    extendedActions (): CrudAction[] {
      return this.crudResource?.actions?.filter((act: CrudAction) =>
        act.batched && (
          !this.crudUser || this.crudUser?.hasAccessToApiMethod(act.api)
        )) ?? []
    },
    extendedActionFormValueDefault (): { [key: string]: any } {
      const act = this.extendedActions[this.actionsTab]
      return act?.api?.form?.reduce<Object>((obj: { [key: string]: any }, input: CrudFormInput) => {
        obj[input.key] = null
        return obj
      }, {}) ?? {}
    },
    extendedActionFormValue (): { [key: string]: any } {
      const act = this.extendedActions[this.actionsTab]
      const values: { [key: string]: any } = { ...this.actionFormValue }
      if (act.batchKey) {
        values[act.batchKey] = this.valueSelections.map((item: any) => {
          return item[act.batchItemPrimaryKey ?? 'id']
        })
      }
      return values
    },
    extendedActionBindings (): ScehmaRendererBinding[] {
      const act = this.extendedActions[this.actionsTab]
      const actionFormValue = this.extendedActionFormValue
      const bindings = Object.entries(actionFormValue).map<ScehmaRendererBinding>((entry: any[]) => {
        return {
          name: entry[0],
          type: typeof entry[1] === 'object' ? 'default'
            : typeof entry[1] === 'string' ? 'string' : 'json',
          default: entry[1],
        }
      })
      if (act?.api?.bindings) {
        bindings.push(...act.api.bindings)
      }
      return bindings
    },
  },

  methods: {
    genDialog (activator: Function, visible: boolean, onVisibleChanged: Function, content: VNode[]): VNode {
      return this.$createElement(
        VDialog,
        {
          props: {
            value: visible,
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
    genFormCard (title: string, content: VNode[], actions: VNode[]): VNode[] {
      return [
        this.$createElement(
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
        ),
      ]
    },
    genCreateForm (): VNode[] {
      return this.genFormCard(this.$vuetify.lang.t('$vuetify.crud.toolbar.create.title'), [], [
        this.$createElement(
          VBtn,
          {
            props: {
              color: 'secondary',
              dense: true,
              dark: true,
            },
          },
          this.$vuetify.lang.t('$vuetify.crud.toolbar.create.cancel'),
        ),
        this.$createElement(
          VBtn,
          {
            props: {
              color: 'primary',
              dense: true,
              dark: true,
            },
          },
          this.$vuetify.lang.t('$vuetify.crud.toolbar.create.submit'),
        ),
      ])
    },
    genFiltersForm (): VNode[] {
      return this.genFormCard(this.$vuetify.lang.t('$vuetify.crud.toolbar.filters.title'), [], [
        this.$createElement(
          VBtn,
          {
            props: {
              color: 'secondary',
              dense: true,
              dark: true,
              loading: this.savingFilters,
            },
            on: {
              click: () => {
                this.savingFilters = true
                this.$emit('save-settings', this.crudResource, this.filtersForm, () => {
                  this.filtersDialog = false
                  this.savingFilters = false
                  this.expandMode = ''
                })
              },
            },
          },
          this.$vuetify.lang.t('$vuetify.crud.toolbar.filters.save'),
        ),
        this.$createElement(
          VBtn,
          {
            props: {
              color: 'secondary',
              dense: true,
              dark: true,
            },
            on: {
              click: () => {
                this.filtersDialog = false
                this.expandMode = ''
                this.$emit('reset-filters', this.crudResource)
              },
            },
          },
          this.$vuetify.lang.t('$vuetify.crud.toolbar.filters.reset'),
        ),
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
                this.filtersDialog = false
                this.expandMode = ''
                this.$emit('change-filters', this.crudResource, this.filtersForm)
              },
            },
          },
          this.$vuetify.lang.t('$vuetify.crud.toolbar.filters.reload'),
        ),
      ])
    },
    genSettingsForm (): VNode[] {
      return this.genFormCard(this.$vuetify.lang.t('$vuetify.crud.toolbar.settings.title'), [
        this.$createElement(
          VSelect,
          {
            props: {
              label: this.$vuetify.lang.t('$vuetify.crud.toolbar.settings.itemsPerPage'),
              dense: true,
              value: this.settingsForm.perPage,
              items: this.itemsPerPageOptions,
              'hide-details': true,
            },
            on: {
              change: (e: any) => {
                this.settingsForm.perPage = e
              },
            },
          }
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
              this.crudResource?.columns?.map?.<VNode>((col: CrudColumn) => {
                return this.$createElement(
                  VCheckbox,
                  {
                    staticClass: 'ms-5',
                    props: {
                      dense: true,
                      label: col.title,
                      inputValue: this.settingsForm.hideColumns?.includes(col.name),
                      'hide-details': true,
                    },
                    on: {
                      change: (c: boolean) => {
                        if (!this.settingsForm.hideColumns) {
                          this.settingsForm.hideColumns = []
                        }
                        if (c && !this.settingsForm.hideColumns?.includes(col.name)) {
                          this.settingsForm.hideColumns?.push(col.name)
                        } else if (!c) {
                          const index = this.settingsForm.hideColumns?.indexOf(col.name)
                          if (index >= 0) {
                            this.settingsForm.hideColumns?.splice(index, 1)
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
              value: this.settingsForm.loadRelations,
            },
            on: {
              change: (relations: any) => {
                this.settingsForm.loadRelations = relations
              },
            },
          },
        ),
        this.$createElement(
          VCheckbox,
          {
            props: {
              label: this.$vuetify.lang.t('$vuetify.crud.toolbar.settings.includeTrashed'),
              inputValue: this.settingsForm.includeTrashed,
            },
            on: {
              change: (e: boolean) => {
                this.settingsForm.includeTrashed = e
              },
            },
          },
        ),
      ], [
        this.$createElement(
          VBtn,
          {
            props: {
              color: 'secondary',
              dense: true,
              dark: true,
              loading: this.savingSettings,
            },
            on: {
              click: () => {
                this.savingSettings = true
                this.$emit('save-settings', this.crudResource, this.settingsForm, () => {
                  this.savingSettings = false
                  this.settingsDialog = false
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
            },
            on: {
              click: () => {
                this.settingsDialog = false
                this.expandMode = ''
                this.$emit('reset-settings', this.crudResource)
              },
            },
          },
          this.$vuetify.lang.t('$vuetify.crud.toolbar.settings.reset'),
        ),
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
                this.$emit('change-settings', this.crudResource, this.settingsForm)
              },
            },
          },
          this.$vuetify.lang.t('$vuetify.crud.toolbar.settings.reload'),
        ),
      ])
    },
    getActionsToolbarButton (): VNode {
      return this.genIconButton(this.expandMode === 'actions' ? 'mdi-close' : 'mdi-form-textbox', {
        color: this.expandMode === 'actions' ? 'warning' : 'secondary',
        ...this.sizableProps,
      }, {
        ...this.sizableProps,
      },
      () => {
        this.expandMode = this.expandMode === 'actions' ? '' : 'actions'
        if (this.toolbarMode === 'actions') {
          this.toolbarMode = 'default'
          this.$emit('actions-closed', this.crudResource)
        } else {
          this.toolbarMode = 'actions'
          this.actionFormValue = this.extendedActionFormValueDefault
          this.$emit('actions-opened', this.crudResource)
        }
      })
    },
    getSearchToolbarButton (): VNode {
      return this.genIconButton(this.searchMode ? 'mdi-close' : 'mdi-magnify', {
        color: this.searchMode ? 'warning' : 'secondary',
        ...this.sizableProps,
      }, {
        ...this.sizableProps,
      },
      () => {
        if (!this.searchMode) {
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
      })
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
                if (e.keyCode === 13) {
                  this.$emit('search', this.crudResource, this.searchTerm)
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
          this.genIconButton('mdi-refresh', {
            loading: this.loading,
            ...this.sizableProps,
          }, {
            ...this.sizableProps,
          },
          () => {
            this.$emit('reload', this.crudResource, this.filtersForm, this.settingsForm)
          }),
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
        ]
      )
      if (this.canCreateNew) {
        toolbarTools.push(
          // create
          this.genDialog(
            (props: any) => {
              return this.genIconButton(this.expandMode === 'create' ? 'mdi-close' : 'mdi-plus-box', {
                color: this.expandMode === 'create' ? 'warning' : 'green',
                ...this.sizableProps,
              }, {
                ...this.sizableProps,
              },
              (e: any) => {
                this.expandMode = this.expandMode === 'create' ? '' : 'create'
                props.on.click(e)
              })
            },
            this.createDialog,
            (visible: boolean) => {
              this.createDialog = visible
            },
            this.genCreateForm()
          ),
        )
      }
      if (this.hasFilters) {
        toolbarTools.push(
          // filters
          this.genDialog(
            (props: any) => {
              return this.genIconButton(this.expandMode === 'filters' ? 'mdi-close' : 'mdi-filter', {
                color: this.expandMode === 'filters' ? 'warning' : 'secondary',
                ...this.sizableProps,
              }, {
                ...this.sizableProps,
              },
              (e: any) => {
                this.expandMode = this.expandMode === 'filters' ? '' : 'filters'
                props.on.click(e)
              })
            },
            this.filtersDialog,
            (visible: boolean) => {
              this.filtersDialog = visible
            },
            this.genFiltersForm()
          ),
        )
      }
      if (this.canChangeSettings) {
        toolbarTools.push(
          // settings
          this.genDialog(
            (props: any) => {
              return this.genIconButton(this.expandMode === 'settings' ? 'mdi-close' : 'mdi-settings', {
                color: this.expandMode === 'settings' ? 'warning' : 'secondary',
                ...this.sizableProps,
              }, {
                ...this.sizableProps,
              },
              (e: any) => {
                this.expandMode = this.expandMode === 'settings' ? '' : 'settings'
                props.on.click(e)
              })
            },
            this.settingsDialog,
            (visible: boolean) => {
              this.settingsDialog = visible
            },
            this.genSettingsForm()
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
                this.actionFormValue = this.extendedActionFormValueDefault
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
                  act.title,
                ]
              )
            }),
          ]
        ),
        this.getActionsToolbarButton(),
      ]
    },
    getExtendedActionForm (): SchemaRendererComponent[] {
      return this.extendedActions[this.actionsTab]?.api?.form?.map<SchemaRendererComponent>((input: CrudFormInput) => {
        return {
          ...(input.component ?? {}),
          'v-model': 'bindings.' + input.key,
        }
      }) ?? []
    },
    getExtendedActionButtons (): SchemaRendererComponent[] {
      return this.extendedActions[this.actionsTab]?.api?.actions ?? []
    },
    genToolbar (): VNode {
      const toolbarTools = []
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
    genExtendedForms (): VNode {
      return this.$createElement(
        VCard,
        {
          staticClass: 'ma-1 ma-md-2',
        },
        [
          this.$createElement(
            VCardText,
            {},
            [
              this.$createElement(
                VSchemaRenderer,
                {
                  props: {
                    bindings: this.extendedActionBindings,
                    schema: {
                      tag: 'div',
                      staticClass: 'd-flex flex-column',
                      children: this.getExtendedActionForm(),
                    },
                  },
                  on: {
                    input: (renderer: SchemaRendererAgent, bindings: { [key: string]: any }) => {
                      this.actionFormValue = bindings
                    },
                  },
                }
              ),
            ],
          ),
          this.$createElement(
            VCardActions,
            {},
            [
              this.$createElement(
                VSchemaRenderer,
                {
                  props: {
                    bindings: this.extendedActionBindings,
                    schema: {
                      tag: 'div',
                      staticClass: 'd-flex flex-row',
                      children: this.getExtendedActionButtons(),
                    },
                  },
                },
              ),
            ]
          ),
        ]
      )
    },
    genIconButton (icon: string, props: {}, iconProps: {}, click: Function): VNode {
      return this.$createElement(VBtn, {
        props: {
          icon: true,
          ...props,
        },
        on: {
          click,
        },
      }, [
        this.$createElement(VIcon, {
          props: iconProps,
        }, icon),
      ])
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
