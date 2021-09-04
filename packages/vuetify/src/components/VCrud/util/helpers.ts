export function getNestedObjectValue (object: { [key: string]: any }, path: string|undefined, def: any = null): any {
  const parts = path?.split('.') ?? []
  let ref = object

  for (let index = 0; index < parts.length; index++) {
    const part = parts[index]
    if (ref && ref[part]) {
      ref = ref[part]
    } else {
      return def
    }
  }
  return ref
}
