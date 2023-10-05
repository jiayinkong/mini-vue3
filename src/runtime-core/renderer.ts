import { createComponentInstance, setupComponent } from './component';
import { ShapeFlags } from '../shared/shapeFlags';
import { Fragment, Text } from './vnode';

export function render(vnode, container) {
  patch(vnode, container);
}

function patch(vnode, container) {
  const { shapeFlag, type } = vnode;

  switch (type) {
    case Fragment:
      processFragment(vnode, container);
      break;

    case Text:
      processText(vnode, container);
      break;

    default:
      if (shapeFlag & ShapeFlags.ELEMENT) {
        // 处理 Element
        processElement(vnode, container);
      } else {
        // 处理组件
        processComponent(vnode, container);
      }
      break;
  }
}

function processElement(vnode, container) {
  mountElement(vnode, container);
}

function mountElement(vnode, container) {
  // 1. 创建标签
  const el = (vnode.el = document.createElement(vnode.type));

  // 2. 处理 标签内容
  const { children, shapeFlag } = vnode;
  // children 是字符串
  if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
    el.textContent = children;
    // children 是数组
  } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
    mountChildren(vnode, el);
  }

  const { props } = vnode;

  // 3. 处理标签的 props 属性
  // 循环 props
  for (const key in props) {
    const val = props[key];
    const isOn = (key: string) => /^on[A-Z]/.test(key);
    if (isOn(key)) {
      const event = key.slice(2).toLowerCase();
      el.addEventListener(event, val);
    }
    el.setAttribute(key, val);
  }

  // 4. 把 el 添加到 container
  container.append(el);
}

function mountChildren(vnode, container) {
  vnode.children.forEach((v) => {
    patch(v, container);
  });
}

function processComponent(vnode, container) {
  mountComponent(vnode, container);
}

function mountComponent(initialVNode, container) {
  // 创建组件实例 instance
  const instance = createComponentInstance(initialVNode);

  // 处理setup的返回结果、设置组件实例 instance 的 setupState、render 属性、
  // 实现组件对象的代理
  setupComponent(instance, container);

  // 触发组件实例的 render 函数
  setupRenderEffect(instance, initialVNode, container);
}

function processFragment(vnode, container) {
  mountFragment(vnode, container);
}

function mountFragment(vnode, container) {
  mountChildren(vnode, container);
}

function processText(vnode, container) {
  const { children } = vnode;
  const textNode = (vnode.el = document.createTextNode(children));
  container.append(textNode);
}

function setupRenderEffect(instance, initialVNode, container) {
  const { proxy } = instance;
  const subTree = instance.render.call(proxy);
  patch(subTree, container);

  // vnode -> element
  initialVNode.el = subTree.el;
}
