import { TagSettings } from 'types/services/schemas'

import WEBTYPES from './WebTypes'

export const TypesDictionary: {[key: string]: any} = {}
WEBTYPES.contributions.html.tags?.forEach((tag: any) => {
  TypesDictionary[tag.name] = tag
})

export function GetItemTypeSettingsFromDictionary (item: any): TagSettings|null {
  let dic = null
  WEBTYPES.contributions.html.tags.forEach((tag: any) => {
    if (item.tag === tag.name) {
      dic = tag
    }
  })
  return dic
}

export default WEBTYPES
