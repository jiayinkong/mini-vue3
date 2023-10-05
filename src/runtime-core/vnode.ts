import { ShapeFlags } from '../shared/shapeFlags';

export function createVNode(type, props?, children?) {
  const vnode = {
    type,
    props,
    children,
    shapeFlags: getShapeFlags(type), // 初步根据 type 判断 shapeFlags
    el: null,
  };

  // 针对 children 进一步判断 shapeFlags
  if(typeof children === 'string') {
    // 使用 | 运算符，这样就能判断两样，type 和 children
    vnode.shapeFlags |= ShapeFlags.TEXT_CHILDREN;
  } else if(Array.isArray(children)) {
    vnode.shapeFlags |= ShapeFlags.ARRAY_CHILDREN;
  }

  // slots 的条件：组件 + children 是 object
  if(vnode.shapeFlags & ShapeFlags.STATEFUL_COMPONENT) {
    if(typeof children === 'object') {
      vnode.shapeFlags |= ShapeFlags.SLOT_CHILDREN;
    }
  }

  return vnode;
}

function getShapeFlags(type) {
  return typeof type === 'string' ?
    ShapeFlags.ELEMENT :
    ShapeFlags.STATEFUL_COMPONENT;
}
