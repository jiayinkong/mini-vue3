import { createComponentInstance, setupComponent } from './component';
import { ShapeFlags } from '../shared/shapeFlags';
import { Fragment, Text } from './vnode';
import { createAppAPI } from './createApp';
import { effect } from '../reactivity/effect';
import { shouldUpdateComponent } from './componentUpdateUtils';
import { queueJobs } from './scheduler';

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
    /** 
     *         a b
     * (h f g) a b
     * 
     * a b
     * a b (d)
     */
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
    /**
     * 
     */
    } else if(i > e2) {
      while(i <= e1) {
        hostRemove(c1[i].el);
        i++;
      }
    } else {
      // 中间对比
      let s1 = i; // 旧节点开始位置
      let s2 = i; // 新节点开始位置

      /**
       * keyToNewIndexMap key-newIndex 
       * key 新节点的 key 
       * value 新节点的索引
       */
      const keyToNewIndexMap = new Map(); 
      
      // 新节点中间那些需要patch的个数，newIndexToOldIndexMap 的 length
      const toBePatched = e2 - s2 + 1;
      let patched = 0; // 开始的patch数

      /**
       * newIndexToOldIndexMap 对应中间那些待 patch 的新节点，
       * 索引 index 为 0 ～ (toBepatched-1)
       * 值为老节点索引
       */
      const newIndexToOldIndexMap = new Array(toBePatched);
      let moved = false;
      // 协助判断 moved，遍历老节点，如当前对应的 newIndex 更大，更新 newIndex
      // 理应当前的对应的 newIndex 比上一个节点大，否则表明有移动
      let maxNewIndexSoFar = 0;

      // 初始化 newIndexToOldIndexMap，处于没被标记为有对应的老节点的状态
      for(let i = 0; i < toBePatched; i++) {
        newIndexToOldIndexMap[i] = 0;
      }

      // 遍历新节点
      for(let i = s2; i <= e2; i++) {
        const nextChild = c2[i];
        keyToNewIndexMap.set(nextChild.key, i);
      }

      // 遍历老节点
      for(let i = s1; i <= e1; i++) {
        const prevChild = c1[i];

        // 中间部分，老的比新的多，那么多出来的直接可以被干掉
        if(patched >= toBePatched) {
          hostRemove(prevChild.el);
          continue;
        }

        let newIndex;
        if(prevChild.key != null) {
          newIndex = keyToNewIndexMap.get(prevChild.key);
        } else {
          for(let j = s2; j <= e2; j++) {
            if(isSameVNodeType(prevChild, c2[j])) {
              newIndex = j;

              break;
            }
          }
        }

        // 老的节点不存在于新节点中
        if(newIndex === undefined) {
          hostRemove(prevChild.el);
        
        // 老的节点存在于新节点中
        } else {

          if(newIndex >= maxNewIndexSoFar) {
            // 随着老节点往下遍历，老节点对应的 newIndex 更大的话，更新 maxNewIndexSoFar 值
            maxNewIndexSoFar = newIndex;
          } else {
            // 只要有 newIndex 变小了，就说明有移动
            moved = true;
          }

          // 可以看作是需要 patch 的新节点数组的索引与老节点索引之间的映射关系
          // i + 1 是为了规避 0
          // 0 在 newIndexToOldIndexMap 中表示还没开始找映射关系的一种状态
          newIndexToOldIndexMap[newIndex - s2] = i + 1;
          patch(prevChild, c2[newIndex], container, parentComponent, null);
          patched++;
        }
      } 

      // increasingNewIndexSequence 是最长递增子序列
      // 项代表需要 patch 的节点的索引
      // 在 increasingNewIndexSequence 序列中的元素不需要移动
      const increasingNewIndexSequence = moved ? getSequence(newIndexToOldIndexMap) : [];
      // 相当于一个指针指向最长递增子序列数组尾部
      let j = increasingNewIndexSequence.length - 1;

      // 遍历需要 patch 的新节点找出不在最长递子序列中的节点索引，进行节点的移动，
      // 之所以 for 遍历 toBePatched + 移动 j 指针 可行 ，是因为它们都是升序的
      // 从后往前遍历，性能更优
      for(let i = toBePatched - 1; i >= 0; i--) {
        const nextIndex = i + s2; // 当前需要被移动的节点位置
        const nextChild = c2[nextIndex]; // 当前需要被移动的节点
        const anchor = nextIndex + 1 < l2 ? c2[nextIndex + 1].el : null; // 插入锚点
        
        // 当前节点不存在于老节点中，创建
        // 1. 上面没有 key 的节点，由于 newIndex 为 undefined 已被移除，但会来到这里新创建
        // 也就是没有 key 的节点，经历了移除、创建两个步骤
        // 2. 有 key 但不存在于老节点中
        if(newIndexToOldIndexMap[i] === 0) {
          patch(null, nextChild, container, parentComponent, anchor);
        }

        if(moved) {
          // 从需要 patch 的节点中，找出不在最长递增子序列中的索引 i，
          // 该索引 i 对应的节点才需要移动
          if(j < 0 || i !== increasingNewIndexSequence[j]) {
            console.log('移动');
            hostInsert(nextChild.el, container, anchor);
          } else {
            // 如果 i 包含在最长递增子序列内，则移动指针，判断下一个
            j--;
          }
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
    if(!n1) {
      mountComponent(n2, container, parentComponent, anchor);
    } else {
      updateComponent(n1, n2);
    }
  }

  function updateComponent(n1, n2) {
    const instance = (n2.component = n1.component);

    if(shouldUpdateComponent(n1, n2)) {
      instance.next = n2;
      instance.update();
    } else {
      n2.el = n1.el;
      instance.vnode = n2;
    }
  }
  
  function mountComponent(initialVNode, container, parentComponent, anchor) {
    // 创建组件实例 instance
    const instance = (initialVNode.component = createComponentInstance(initialVNode, parentComponent));
  
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
    instance.update = effect(() => {
      if(!instance.isMounted) {
        console.log('init');
        const { proxy } = instance;
        const subTree = (instance.subTree = instance.render.call(proxy, proxy));
        
        patch(null, subTree, container, instance, anchor);
      
        // vnode -> element
        initialVNode.el = subTree.el;

        instance.isMounted = true;
      } else {
        console.log('update');

        // 更新 props，需要一个 vnode
        const { next, vnode } = instance;
        if(next) {
          // 设置 新虚拟节点的 el
          next.el = vnode.el;
          updateComponentPreRender(instance, next);
        }

        const { proxy } = instance;
        const subTree = instance.render.call(proxy, proxy);
        const prevSubTree = instance.subTree;
        instance.sbuTree = subTree;

        patch(prevSubTree, subTree, container, instance, anchor);
      }
    }, {
      scheduler() {
        console.log('update - scheduler');
        queueJobs(instance.update); 
      }
    });
  }

  return {
    createApp: createAppAPI(render),
  }
}

function updateComponentPreRender(instance, nextVNode) {
  // 更新当前实例的 vnode 为新的
  instance.vnode = nextVNode;
  // 当前实例的 next 节点清空 
  instance.next = null; 
  // 更新当前实例的 props 
  instance.props = nextVNode.props;
}

function getSequence(arr) {
  const p = arr.slice();
  const result = [0];
  let i, j, u, v, c;
  const len = arr.length;
  for(i = 0; i < len; i++) {
    const arrI = arr[i];
    if(arrI !== 0) {
      j = result[result.length - 1];
      if(arr[j] < arrI) {
        p[i] = j;
        result.push(i);
        continue;
      }
      u = 0;
      v = result.length - 1;
      while(u < v) {
        c = (u + v) >> 1;
        if(arr[result[c]] < arrI) {
          u = c + 1;
        } else {
          v = c;
        }
      }
      if(arrI < arr[result[u]]) {
        if(u > 0) {
          p[i] = result[u - 1];
        }
        result[u] = i;
      }
    }
  }
  u = result.length;
  v = result[u - 1];
  while(u-- > 0) {
    result[u] = v;
    v = p[v];
  }
  return result;
}




// vnode, subTree, n1, n2 - 虚拟节点 h('div', {}, []) h('div', {}, '')

// container - 标签，一开始是 rooContainer最外层标签，
// 后面会经过 mountChildren 的过程，
// 把 vnode.el(document.createElement新建的标签)作为 container 传给 patch 作为 children-vnode 的 container

// parentComponent - 父组件实例 instance
// 在 setupRenderEffect 时，执行 instance.render 得到 subTree，
// subTree作为新的vnode传给patch递归，而instance 便是作为父组件实例
