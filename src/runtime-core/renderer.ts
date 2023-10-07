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
    remove: hostRemove,
    setElementText: hostSetElementText,
  } = options;

  function render(vnode, container) {
    patch(null, vnode, container, null, null);
  }
  
  // n1 -> old, n2 -> new
  function patch(n1, n2, container, parentComponent, anchor) {
    const { shapeFlag, type } = n2;
  
    switch (type) {
      case Fragment:
        processFragment(n1, n2, container, parentComponent, anchor);
        break;
  
      case Text:
        processText(n1, n2, container);
        break;
  
      default:
        if (shapeFlag & ShapeFlags.ELEMENT) {
          // 处理 Element
          processElement(n1, n2, container, parentComponent, anchor);
        } else {
          // 处理组件
          processComponent(n1, n2, container, parentComponent, anchor);
        }
        break;
    }
  }
  
  function processElement(n1, n2, container, parentComponent, anchor) {
    if(!n1) {
      mountElement(n2, container, parentComponent, anchor);
    } else {
      patchElement(n1, n2, container, parentComponent, anchor);
    }
  }

  function patchElement(n1, n2, container, parentComponent, anchor) {

    // 更新 props：
    const oldProps = n1.props || EMPTY_OBJ;
    const newProps = n2.props || EMPTY_OBJ;

    const el = (n2.el = n1.el);

    patchChildren(n1, n2, el, parentComponent, anchor);
    patchProps(el, oldProps, newProps);
  }

  function patchChildren(n1, n2, container, parentComponent, anchor) {
    const prevShapeFlag = n1.shapeFlag;
    const { shapeFlag } = n2;
    const c1 = n1.children;
    const c2 = n2.children;

    // // 新的 children 是 text
    if(shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      if(prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        // 1. 把老的 children 清空
        unmountChildren(n1.children);
      }

      if(c1 !== c2) {
        hostSetElementText(container, c2);
      }
    // 新的 children 是 array
    } else {
      // 旧的 children 是 text
      if(prevShapeFlag & ShapeFlags.TEXT_CHILDREN) {
        hostSetElementText(container, '');
        mountChildren(c2, container, parentComponent, anchor);
      
      // 旧的 children 是 array
      } else {
        // array diff array
        patchKeyedChildren(c1, c2, container, parentComponent, anchor);
      }
    }
  }

  function patchKeyedChildren(c1, c2, container, parentComponent, parentAnchor) {
    const l2 = c2.length;
    let i = 0;
    let e1 = c1.length - 1;
    let e2 = l2 - 1;

    function isSameVNodeType(n1, n2) {
      return n1.type === n2.type && n1.key === n2.key;
    }

    // 左侧
    while(i <= e1 && i <= e2) {
      const n1 = c1[i];
      const n2 = c2[i];

      if(isSameVNodeType(n1, n2)) {
        patch(n1, n2, container, parentComponent, parentAnchor);
      } else {
        break;
      }

      i++;
    }

    // 右侧
    while(i <= e1 && i <= e2) {
      const n1 = c1[e1];
      const n2 = c2[e2];

      if(isSameVNodeType(n1, n2)) {
        patch(n1, n2, container, parentComponent, parentAnchor);
      } else {
        break;
      }

      e1--;
      e2--;
    }

    // 新的比老的多 创建
    if(i > e1) {
      if(i <= e2) {
        const nextPos = e2 + 1;
        const anchor = nextPos < l2 ? c2[nextPos].el : null;

        while(i <= e2) {
          patch(null, c2[i], container, parentComponent, anchor);
          i++;
        }
      }
    // 老的比新的长 删除
    } else if(i > e2) {
      while(i <= e1) {
        hostRemove(c1[i].el);
        i++;
      }
    } else {
      // 中间对比
      let s1 = i;
      let s2 = i;

      const toBePatched = e2 - s2 + 1;
      let patched = 0
      const keyToNewIndexMap = new Map();

      for(let i = s2; i <= e2; i++) {
        const nextChild = c2[i];
        keyToNewIndexMap.set(nextChild.key, i);
      }

      for(let i = s1; i <= e1; i++) {
        const prevChild = c1[i];

        // 中间部分，老的比新的多，那么多出来的直接可以被干掉
        if(patched >= toBePatched) {
          hostRemove(prevChild.el);
          continue;
        }

        let newIndex;
        if(prevChild.key !== null) {
          newIndex = keyToNewIndexMap.get(prevChild.key);
        } else {
          for(let j = s2; j < e2; j++) {
            if(isSameVNodeType(prevChild, c2[j])) {
              newIndex = j;

              break;
            }
          }
        }

        if(newIndex === undefined) {
          hostRemove(prevChild.el);
        } else {
          patch(prevChild, c2[newIndex], container, parentComponent, null);
          patched++;
        }
      }
    }
  }

  function unmountChildren(children) {
    for(let i = 0; i < children.length; i++) {
      const el = children[i].el;
      // remove
      hostRemove(el);
    }
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
  
  function mountElement(vnode, container, parentComponent, anchor) {
    // 1. 创建标签
    const el = (vnode.el = hostCreateElement(vnode.type));
  
    // 2. 处理 标签内容
    const { children, shapeFlag } = vnode;
    // children 是字符串
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      el.textContent = children;
      // children 是数组
    } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      mountChildren(vnode.children, el, parentComponent, anchor);
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
    hostInsert(el, container, anchor);
  }
  
  function mountChildren(children, container, parentComponent, anchor) {
    children.forEach((v) => {
      patch(null, v, container, parentComponent, anchor);
    });
  }
  
  function processComponent(n1, n2, container, parentComponent, anchor) {
    mountComponent(n2, container, parentComponent, anchor);
  }
  
  function mountComponent(initialVNode, container, parentComponent, anchor) {
    // 创建组件实例 instance
    const instance = createComponentInstance(initialVNode, parentComponent);
  
    // 处理setup的返回结果、设置组件实例 instance 的 setupState、render 属性、
    // 实现组件对象的代理
    setupComponent(instance, container);
  
    // 触发组件实例的 render 函数
    setupRenderEffect(instance, initialVNode, container, anchor);
  }
  
  function processFragment(n1, n2, container, parentComponent, anchor) {
    mountFragment(n1, n2, container, parentComponent, anchor);
  }
  
  function mountFragment(n1, n2, container, parentComponent, anchor) {
    mountChildren(n2.children, container, parentComponent, anchor);
  }
  
  function processText(n1, n2, container) {
    const { children } = n2;
    const textNode = (n2.el = document.createTextNode(children));
    container.append(textNode);
  }
  
  function setupRenderEffect(instance, initialVNode, container, anchor) {
    effect(() => {
      if(!instance.isMounted) {
        console.log('init');
        const { proxy } = instance;
        const subTree = (instance.subTree = instance.render.call(proxy));
        
        patch(null, subTree, container, instance, anchor);
      
        // vnode -> element
        initialVNode.el = subTree.el;

        instance.isMounted = true;
      } else {
        console.log('update');
        const { proxy } = instance;
        const subTree = instance.render.call(proxy);
        const prevSubTree = instance.subTree;
        instance.sbuTree = subTree;

        patch(prevSubTree, subTree, container, instance, anchor);
      }
    });
  }

  return {
    createApp: createAppAPI(render),
  }
}




// vnode, subTree, n1, n2 - 虚拟节点 h('div', {}, []) h('div', {}, '')

// container - 标签，一开始是 rooContainer最外层标签，
// 后面会经过 mountChildren 的过程，
// 把 vnode.el(document.createElement新建的标签)作为 container 传给 patch 作为 children-vnode 的 container

// parentComponent - 父组件实例 instance
// 在 setupRenderEffect 时，执行 instance.render 得到 subTree，
// subTree作为新的vnode传给patch递归，而instance 便是作为父组件实例
