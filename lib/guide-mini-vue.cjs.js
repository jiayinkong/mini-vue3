'use strict';

var ShapeFlags;
(function (ShapeFlags) {
    ShapeFlags[ShapeFlags["ELEMENT"] = 1] = "ELEMENT";
    ShapeFlags[ShapeFlags["STATEFUL_COMPONENT"] = 2] = "STATEFUL_COMPONENT";
    ShapeFlags[ShapeFlags["TEXT_CHILDREN"] = 4] = "TEXT_CHILDREN";
    ShapeFlags[ShapeFlags["ARRAY_CHILDREN"] = 8] = "ARRAY_CHILDREN";
    ShapeFlags[ShapeFlags["SLOT_CHILDREN"] = 16] = "SLOT_CHILDREN";
})(ShapeFlags || (ShapeFlags = {}));
// | 运算符逻辑，同时为 0 才是 0，（只要有 1 就是 1）
// & 运算符逻辑，同时为 1 才是 1，（只要有 0 就是 0）

const Fragment = Symbol('Fragment');
const Text = Symbol('Text');
function createVNode(type, props, children) {
    const vnode = {
        type,
        props,
        children,
        shapeFlag: getShapeFlags(type),
        el: null,
    };
    // 针对 children 进一步判断 shapeFlag
    if (typeof children === "string") {
        // 使用 | 运算符，这样就能判断两样，type 和 children
        vnode.shapeFlag |= ShapeFlags.TEXT_CHILDREN;
    }
    else if (Array.isArray(children)) {
        vnode.shapeFlag |= ShapeFlags.ARRAY_CHILDREN;
    }
    // slots 的条件：组件 + children 是 object
    if (vnode.shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
        if (typeof children === "object") {
            vnode.shapeFlag |= ShapeFlags.SLOT_CHILDREN;
        }
    }
    return vnode;
}
function createTextVNode(text) {
    return createVNode(Text, {}, text);
}
function getShapeFlags(type) {
    return typeof type === "string"
        ? ShapeFlags.ELEMENT
        : ShapeFlags.STATEFUL_COMPONENT;
}

const extend = Object.assign;
const isObject = (val) => {
    return val !== null && typeof val === 'object';
};
// 添加 on 前缀，并事件首字母大写
const capitalize = (str) => {
    return str ? str.charAt(0).toUpperCase() + str.slice(1) : '';
};
// 改为驼峰
const camelize = (str) => {
    return str.replace(/-(\w)/g, (_, c) => {
        return c ? c.toUpperCase() : '';
    });
};
const toHandlerKey = (str) => {
    return str ? 'on' + capitalize(str) : '';
};

let targetMap = new Map();
function trigger(target, key) {
    const depsMap = targetMap.get(target);
    const dep = depsMap.get(key);
    triggerEffects(dep);
}
function triggerEffects(dep) {
    for (const effect of dep) {
        if (effect.scheduler) {
            effect.scheduler();
        }
        else {
            effect.run();
        }
    }
}

const get = createGetter();
const set = createSetter();
const readonlyGet = createGetter(true);
const shallowReadonlyGet = createGetter(true, true);
function createGetter(isReadonly = false, shallow = false) {
    return function get(target, key) {
        if (key === "__v_isReative" /* ReactiveFlags.IS_REACTIVE */) {
            return !isReadonly;
        }
        if (key === "__v_isReadonly" /* ReactiveFlags.IS_READONLY */) {
            return isReadonly;
        }
        const res = Reflect.get(target, key);
        if (isReadonly && shallow) {
            return res;
        }
        // 看看 res 是不是 object
        if (isObject(res)) {
            return isReadonly ? readonly(res) : reactive(res);
        }
        return res;
    };
}
function createSetter() {
    return function set(target, key, value) {
        const res = Reflect.set(target, key, value);
        // 触发依赖
        trigger(target, key);
        return res;
    };
}
const mutableHanlders = {
    get,
    set,
};
const readonlyHandlers = {
    get: readonlyGet,
    set(target, key, value) {
        console.warn('不允许修改');
        return true;
    }
};
const shallowReadonlyHandlers = extend({}, readonlyHandlers, {
    get: shallowReadonlyGet
});

function reactive(raw) {
    return createReactiveObject(raw, mutableHanlders);
}
function readonly(raw) {
    return createReactiveObject(raw, readonlyHandlers);
}
function shallowReadonly(raw) {
    return createReactiveObject(raw, shallowReadonlyHandlers);
}
function createReactiveObject(target, baseHandler) {
    if (!isObject(target)) {
        console.warn(`target ${target} should be a object`);
    }
    return new Proxy(target, baseHandler);
}

function initProps(instance, rawProps) {
    instance.props = rawProps || {};
}

function emit(instance, event, ...args) {
    const { props } = instance;
    // props onAdd event -> add
    const handlerName = toHandlerKey(camelize(event));
    const hanlder = props[handlerName];
    hanlder && hanlder(...args);
}

const PublicPropertiesMaps = {
    $el: (i) => i.vnode.el,
    $slots: (i) => i.slots,
};
const PublicInstanceProxyHandlers = {
    get({ _: instance }, key) {
        const { setupState, props } = instance;
        const hasOwn = (val, key) => Object.prototype.hasOwnProperty.call(val, key);
        if (hasOwn(setupState, key)) {
            return setupState[key];
        }
        else if (hasOwn(props, key)) {
            return props[key];
        }
        const publicGetter = PublicPropertiesMaps[key];
        if (publicGetter) {
            return publicGetter(instance);
        }
    }
};

function initSlots(instance, children) {
    const { vnode } = instance;
    if (vnode.shapeFlag & ShapeFlags.SLOT_CHILDREN) {
        normalizeObjectSlots(children, instance.slots);
    }
}
function normalizeObjectSlots(children, slots) {
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

function createComponentInstance(vnode, parent) {
    const component = {
        vnode,
        type: vnode.type,
        setupState: {},
        props: {},
        slots: {},
        provides: parent ? parent.provides : {},
        parent,
        emit: () => { },
    };
    component.emit = emit.bind(null, component);
    return component;
}
function setupComponent(instance, container) {
    initProps(instance, instance.vnode.props);
    initSlots(instance, instance.vnode.children);
    setupStatefulComponent(instance);
}
function setupStatefulComponent(instance) {
    const Component = instance.type;
    const { setup } = Component;
    // 实现组件对象的代理
    instance.proxy = new Proxy({ _: instance }, PublicInstanceProxyHandlers);
    if (setup) {
        setCurrentInstance(instance);
        const setupResult = setup(shallowReadonly(instance.props), {
            emit: instance.emit,
        });
        setCurrentInstance(null);
        // 处理 setup函数的返回结果
        handleSetupResult(instance, setupResult);
    }
}
function handleSetupResult(instance, setupResult) {
    // 如果 setup 返回的是 object
    if (typeof setupResult === 'object') {
        // 设置组件实例的 setupState 状态为 setup 返回的这个对象
        instance.setupState = setupResult;
    }
    // 完成组件 setup
    finishComponentSetup(instance);
}
function finishComponentSetup(instance) {
    const Component = instance.type;
    if (Component.render) {
        instance.render = Component.render;
    }
}
let currentInstance = null;
function getCurrentInstance() {
    return currentInstance;
}
function setCurrentInstance(instance) {
    currentInstance = instance;
}

function render(vnode, container) {
    patch(vnode, container, null);
}
function patch(vnode, container, parentComponent) {
    const { shapeFlag, type } = vnode;
    switch (type) {
        case Fragment:
            processFragment(vnode, container, parentComponent);
            break;
        case Text:
            processText(vnode, container);
            break;
        default:
            if (shapeFlag & ShapeFlags.ELEMENT) {
                // 处理 Element
                processElement(vnode, container, parentComponent);
            }
            else {
                // 处理组件
                processComponent(vnode, container, parentComponent);
            }
            break;
    }
}
function processElement(vnode, container, parentComponent) {
    mountElement(vnode, container, parentComponent);
}
function mountElement(vnode, container, parentComponent) {
    // 1. 创建标签
    const el = (vnode.el = document.createElement(vnode.type));
    // 2. 处理 标签内容
    const { children, shapeFlag } = vnode;
    // children 是字符串
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
        el.textContent = children;
        // children 是数组
    }
    else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        mountChildren(vnode, el, parentComponent);
    }
    const { props } = vnode;
    // 3. 处理标签的 props 属性
    // 循环 props
    for (const key in props) {
        const val = props[key];
        const isOn = (key) => /^on[A-Z]/.test(key);
        if (isOn(key)) {
            const event = key.slice(2).toLowerCase();
            el.addEventListener(event, val);
        }
        el.setAttribute(key, val);
    }
    // 4. 把 el 添加到 container
    container.append(el);
}
function mountChildren(vnode, container, parentComponent) {
    vnode.children.forEach((v) => {
        patch(v, container, parentComponent);
    });
}
function processComponent(vnode, container, parentComponent) {
    mountComponent(vnode, container, parentComponent);
}
function mountComponent(initialVNode, container, parentComponent) {
    // 创建组件实例 instance
    const instance = createComponentInstance(initialVNode, parentComponent);
    // 处理setup的返回结果、设置组件实例 instance 的 setupState、render 属性、
    // 实现组件对象的代理
    setupComponent(instance);
    // 触发组件实例的 render 函数
    setupRenderEffect(instance, initialVNode, container);
}
function processFragment(vnode, container, parentComponent) {
    mountFragment(vnode, container, parentComponent);
}
function mountFragment(vnode, container, parentComponent) {
    mountChildren(vnode, container, parentComponent);
}
function processText(vnode, container) {
    const { children } = vnode;
    const textNode = (vnode.el = document.createTextNode(children));
    container.append(textNode);
}
function setupRenderEffect(instance, initialVNode, container) {
    const { proxy } = instance;
    const subTree = instance.render.call(proxy);
    patch(subTree, container, instance);
    // vnode -> element
    initialVNode.el = subTree.el;
}

function createApp(rootComponent) {
    return {
        mount(rootContainer) {
            const vnode = createVNode(rootComponent);
            render(vnode, rootContainer);
        }
    };
}

function h(type, props, children) {
    return createVNode(type, props, children);
}

function renderSlots(slots, name, props) {
    const slot = slots[name];
    if (slot) {
        // function
        if (typeof slot === 'function') {
            // slot(props) 执行后返回的是一个数组
            return createVNode(Fragment, {}, slot(props));
        }
    }
}

function provide(key, value) {
    // 存
    const currentIsntance = getCurrentInstance();
    if (currentIsntance) {
        let { provides } = currentIsntance;
        const parentProvides = currentIsntance.parent.provides;
        // init
        if (provides === parentProvides) {
            // A = Object.create(B)，把 B 作为 A 的原型，A.__proto__ = B
            // 这里让 currentInstance.provides 继承父实例的 provides，是为了不让父实例的 provides 被修改
            provides = currentIsntance.provides = Object.create(parentProvides);
        }
        provides[key] = value;
    }
}
function inject(key, defaultValue) {
    // 取
    const currentIsntance = getCurrentInstance();
    if (currentIsntance) {
        const parentProvides = currentIsntance.parent.provides;
        if (key in parentProvides) {
            return parentProvides[key];
        }
        else if (defaultValue) {
            if (typeof defaultValue === 'function') {
                return defaultValue();
            }
            else {
                return defaultValue;
            }
        }
    }
}

exports.createApp = createApp;
exports.createTextVNode = createTextVNode;
exports.getCurrentInstance = getCurrentInstance;
exports.h = h;
exports.inject = inject;
exports.provide = provide;
exports.renderSlots = renderSlots;
