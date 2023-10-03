import { 
  createComponentInstance, 
  setupComponent 
} from './component';

export function render(vnode, container) {
  patch(vnode, container);
}

function patch(vnode, container) {
  if(typeof vnode.type === 'object') {
    // 处理组件
    processComponent(vnode, container);
  } else {
    // 处理 Element
    processElement(vnode, container);
  }
}

function processElement(vnode, container) {
  // 1. 创建标签
  const el = document.createElement(vnode.type);

  // 2. 处理 标签内容
  const { children } = vnode;
  // children 是字符串
  if(typeof children === 'string') {
    el.textContent = children; 
  // children 是数组
  } else if(Array.isArray(children)) {
    mountChildren(vnode, el);
  }

  const { props } = vnode;

  // 3. 处理标签的 props 属性
  // 循环 props
  for(const key in props) {
    const val = props[key];
    el.setAttribute(key, val);
  }

  // 4. 把 el 添加到 container
  container.append(el);
}

function mountChildren(vnode, container) {
  vnode.children.forEach(v => {
    patch(v, container);
  });
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