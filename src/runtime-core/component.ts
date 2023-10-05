import { shallowReadonly } from '../reactivity/reactive';
import { initProps } from './componentProps';
import { emit } from './componentEmit';
import { PublicInstanceProxyHandlers } from './componentPublicInstance';
import { initSlots } from './componentSlots';

export function createComponentInstance(vnode) {
  const component = {
    vnode,
    type: vnode.type,
    setupState: {},
    props: {},
    slots: {},
    emit: () => {},
  };
  component.emit = emit.bind(null, component) as any;
  return component;
}

export function setupComponent(instance, container) {
  initProps(instance, instance.vnode.props);
  initSlots(instance, instance.vnode.children);

  setupStatefulComponent(instance);
}

function setupStatefulComponent(instance) {
  const Component = instance.type;
  const { setup } = Component;
  

  // 实现组件对象的代理
  instance.proxy = new Proxy({ _: instance }, PublicInstanceProxyHandlers)

  if(setup) {
    const setupResult = setup(shallowReadonly(instance.props), {
      emit: instance.emit,
    });
    // 处理 setup函数的返回结果
    handleSetupResult(instance, setupResult);
  }
}

function handleSetupResult(instance, setupResult) {
  // 如果 setup 返回的是 object
  if(typeof setupResult === 'object') {
    // 设置组件实例的 setupState 状态为 setup 返回的这个对象
    instance.setupState = setupResult;
  }
  // 完成组件 setup
  finishComponentSetup(instance);
}

function finishComponentSetup(instance) {
  const Component = instance.type;
  if(Component.render) {
    instance.render = Component.render;
  }
}