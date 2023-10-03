import { 
  createComponentInstance, 
  setupComponent 
} from './component';

export function render(vnode, container) {
  patch(vnode, container);
}

function patch(vnode, container) {
  // 处理组件
  processComponent(vnode, container);

  // 处理Element
}

function processComponent(vnode, container) {
  mountComponent(vnode, container);
}

function mountComponent(vnode, container) {
  // 创建组件实例 instance
  const instance = createComponentInstance(vnode);

  // 处理setup的返回结果、设置组件实例 instance 的 setupState、render 属性
  setupComponent(instance, container);


  setupRenderEffect(instance, container);
}

function setupRenderEffect(instance, container) {
  const subTree = instance.render();
  patch(subTree, container);
}