import { Fragment, createVNode } from '../vnode';

export function renderSlots(slots, name, props) {
  const slot = slots[name];
  if(slot) {
    // function
    if(typeof slot === 'function') {
      // slot(props) 执行后返回的是一个数组
    return createVNode(Fragment, {}, slot(props));
    }
  }
}
