import { SchemaRendererBinding, SchemaRendererComponent } from 'types/services/schemas'

export interface CrudPresenter {
  markActionLoading (item: any, act: CrudAction, loading: boolean): void
}

export interface CrudResource {
  name: string
  plural: string
  singular: string
  primaryKey: string
  columns: Array<CrudColumn>
  relations?: Array<CrudRelation>
  exportableColumns?: Array<string>
  actions?: {
    [key: string]: CrudAction
  },
  api?: {
    [key: string]: ApiMethod|undefined
    create?: ApiMethod
    edit?: ApiMethod
    export?: ApiMethod
    delete?: ApiMethod
    query?: ApiMethod
  }
}

export interface CrudRelation extends CrudResource {
  autoloads: Boolean
}

export interface CrudAction {
  title: string | Function
  name: string
  icon?: string
  color?: string
  batched?: Boolean
  batchKey?: string
  batchItemPrimaryKey?: string
  click?: Function
  component?: SchemaRendererComponent
  loading?: boolean
  api?: ApiMethod
}

export interface ApiMethod {
  title?: string | Function
  method?: string
  url?: string
  to?: string
  href?: string
  permission?: string
  bindings?: SchemaRendererBinding[]
  autoValidate?: boolean
  form?: Array<CrudFormInput>
  formTabs?: Array<CrudFormInputTab>
  actions?: SchemaRendererComponent[]
}

export interface CrudFormInputTab {
  value: string
  text: string
}

export interface CrudFormInput {
  key: string
  rules?: Array<Function>
  tab?: string
  component?: SchemaRendererComponent
}

export interface CrudColumn {
  name: string
  title: string
  sortable: boolean
  artificial?: Boolean
  component: SchemaRendererComponent
}

export interface CrudQueryResult {
  total: number
  perPage: number
  currPage: number
  items: Array<any>
  refId?: string
}

export interface CrudUser {
  [key: string]: any
  roles: CrudRole[]
  permissions: CrudPermission[]

  hasAccessToApiMethod (api: ApiMethod): Boolean
  hasPermission (permission: string|number): Boolean
  hasRole (role: string|number): Boolean
}

export interface CrudPermission {
  id: Number
  name: String
}

export interface CrudRole {
  id: Number
  name: string
  priority: Number
}

export interface CrudTableSettings {
  perPage?: Number
  includeTrashed?: Boolean
  hideColumns?: Array<string>
  loadRelations?: { [key: string]: Array<string>|string }
  sortBy?: string
  sortDesc?: boolean
}

export function CrudQueryLoader (
  crud: CrudResource,
  page: number|undefined,
  limit: number|undefined,
  settings: CrudTableSettings|undefined,
  filters: { [key: string]: any }|undefined,
): CrudQueryResult
