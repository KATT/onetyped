import { defaults } from './defaults'
import { defineNode } from './types'

export const string = () => {
  return defineNode({
    typeName: 'string',
    type: 'string',
    ...defaults,
  })
}
