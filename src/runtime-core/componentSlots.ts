import { ShapeFlags } from '../shared/shapeFlags';

export function initSlots(instance, children) {
  const { vnode } = instance;
  if (vnode.shapeFlag & ShapeFlags.SLOT_CHILDREN) {
    normalizeObjectSlots(children, instance.slots);
  }
}

export function normalizeObjectSlots(children, slots) {
  // children 是 object
  for (const key in children) {
    const value = children[key];
    // slots[key] 是一个函数，函数返回的是一个数组，
    // 这样是因为在 renderSlots 里面， createVNode 函数的 children 只能是数组或字符串
    // 注意这里的字符串是指一个最外层的字符串，而不是数组里的字符串
    slots[key] = (props) => normalizeSlotValue(value(props));
  }
}

function normalizeSlotValue(value) {
  return Array.isArray(value) ? value : [value];
}
