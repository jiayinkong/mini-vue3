import { createComponentInstance, setupComponent } from './component';
import { ShapeFlags } from '../shared/shapeFlags';
import { Fragment, Text } from './vnode';
import { createAppAPI } from './createApp';
import { effect } from '../reactivity/effect';

export function createRenderer(options) {
  const { 
    createElement: hostCreateElement, 
    patchProp: hostPatchProp, 
    insert: hostInsert, 
  } = options;

  function render(vnode, container) {
    patch(null, vnode, container, null);
  }
  
  // n1 -> old, n2 -> new
  function patch(n1, n2, container, parentComponent) {
    const { shapeFlag, type } = n2;
  
    switch (type) {
      case Fragment:
        processFragment(n1, n2, container, parentComponent);
        break;
  
      case Text:
        processText(n1, n2, container);
        break;
  
      default:
        if (shapeFlag & ShapeFlags.ELEMENT) {
          // 处理 Element
          processElement(n1, n2, container, parentComponent);
        } else {
          // 处理组件
          processComponent(n1, n2, container, parentComponent);
        }
        break;
    }
  }
  
  function processElement(n1, n2, container, parentComponent) {
    if(!n1) {
      mountElement(n2, container, parentComponent);
    } else {
      patchElement(n1, n2, container);
    }
  }

  function patchElement(n1, n2, container) {
    console.log('patchELement');
    console.log('n1', n1);
    console.log('n2', n2);

    // 更新 props：
    const oldProps = n1.props || EMPTY_OBJ;
    const newProps = n2.props || EMPTY_OBJ;

    const el = (n2.el = n1.el);

    patchProps(el, oldProps, newProps);

    // TODO 更新 children
  }

  const EMPTY_OBJ = {};

  function patchProps(el, oldProps, newProps) {
    if(oldProps !== newProps) {
      for(const key in newProps) {
        const prevProp = oldProps[key];
        const nextProp = newProps[key];
  
        // 1. 旧属性修改为非空新值
        if(prevProp !== nextProp) {
          hostPatchProp(el, key, prevProp, nextProp);
        }
      }

      if(oldProps !== EMPTY_OBJ) {
        for(const key in oldProps) {
          // 2. 删除了旧有属性
          if(!(key in newProps)) {
            hostPatchProp(el, key, oldProps[key], null);
          }
        }
      }
    }
  }
  
  function mountElement(vnode, container, parentComponent) {
    // 1. 创建标签
    const el = (vnode.el = hostCreateElement(vnode.type));
  
    // 2. 处理 标签内容
    const { children, shapeFlag } = vnode;
    // children 是字符串
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      el.textContent = children;
      // children 是数组
    } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      mountChildren(vnode, el, parentComponent);
    }
  
    const { props } = vnode;
  
    // 3. 处理标签的 props 属性
    // 循环 props
    for (const key in props) {
      const val = props[key];
      // 处理注册事件和 props
      hostPatchProp(el, key, null, val);
    }
  
    // 4. 把 el 添加到 container
    hostInsert(el, container);
  }
  
  function mountChildren(vnode, container, parentComponent) {
    vnode.children.forEach((v) => {
      patch(null, v, container, parentComponent);
    });
  }
  
  function processComponent(n1, n2, container, parentComponent) {
    mountComponent(n2, container, parentComponent);
  }
  
  function mountComponent(initialVNode, container, parentComponent) {
    // 创建组件实例 instance
    const instance = createComponentInstance(initialVNode, parentComponent);
  
    // 处理setup的返回结果、设置组件实例 instance 的 setupState、render 属性、
    // 实现组件对象的代理
    setupComponent(instance, container);
  
    // 触发组件实例的 render 函数
    setupRenderEffect(instance, initialVNode, container);
  }
  
  function processFragment(n1, n2, container, parentComponent) {
    mountFragment(n1, n2, container, parentComponent);
  }
  
  function mountFragment(n1, n2, container, parentComponent) {
    mountChildren(n2, container, parentComponent);
  }
  
  function processText(n1, n2, container) {
    const { children } = n2;
    const textNode = (n2.el = document.createTextNode(children));
    container.append(textNode);
  }
  
  function setupRenderEffect(instance, initialVNode, container) {
    effect(() => {
      if(!instance.isMounted) {
        console.log('init');
        const { proxy } = instance;
        const subTree = (instance.subTree = instance.render.call(proxy));
        
        patch(null, subTree, container, instance);
      
        // vnode -> element
        initialVNode.el = subTree.el;

        instance.isMounted = true;
      } else {
        console.log('update');
        const { proxy } = instance;
        const subTree = instance.render.call(proxy);
        const prevSubTree = instance.subTree;
        instance.sbuTree = subTree;

        patch(prevSubTree, subTree, container, instance);
      }
    });
  }

  return {
    createApp: createAppAPI(render),
  }
}
