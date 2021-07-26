import { CrudUser, ApiMethod, CrudRole, CrudPermission } from 'types/services/crud'

export default function createCrudUserWithData (data: { [key: string]: any }): CrudUser {
  return {
    permissions: data.permissions,
    roles: data.roles,
    ...data,

    hasAccessToApiMethod (api: ApiMethod|undefined): Boolean {
      if (api?.permission) {
        return this.permissions.map((perm: CrudPermission) => perm.name).includes(api.permission)
      }
      return true
    },
    hasPermission (permission: string|number): Boolean {
      if (typeof permission === 'string') {
        return this.permissions.map((perm: CrudPermission) => perm.name).includes(permission)
      } else {
        return this.permissions.map((perm: CrudPermission) => perm.id).includes(permission)
      }
    },
    hasRole (role: string|number): Boolean {
      if (typeof role === 'string') {
        return this.roles.map((role: CrudRole) => role.name).includes(role)
      } else {
        return this.roles.map((role: CrudRole) => role.id).includes(role)
      }
    },
  }
}
