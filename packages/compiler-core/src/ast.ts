import { CREATE_ELEMENT_VNODE } from './runtimeHelpers';

export const enum NodeTypes {
  INTERPOLATION,
  SIMPLE_EXPRESSION,
  ELEMENT,
  TEXT,
  ROOT,
  COMPOUND,
}

export const enum TagType {
  Start,
  End,
}

export function createVNodeCall(context, tag, props, children) {
  context.helper(CREATE_ELEMENT_VNODE);
  return {
    type: NodeTypes.ELEMENT,
    tag,
    children,
    props,
}
}