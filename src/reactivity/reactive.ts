import {
  mutableHanlders,
  readonlyHandlers,
  shallowReadonlyHandlers,
} from './basehandlers';

export const enum ReactiveFlags {
  IS_REACTIVE = '__v_isReative',
  IS_READONLY = '__v_isReadonly',
}

export function reactive(raw) {
  return createActiveObject(raw, mutableHanlders);
}

export function isReactive(value) {
  return !!value[ReactiveFlags.IS_REACTIVE];
}

export function readonly(raw) {
  return createActiveObject(raw, readonlyHandlers);
}

export function isReadonly(value) {
  return !!value[ReactiveFlags.IS_READONLY];
}

export function shallowReadonly(raw) {
  return createActiveObject(raw, shallowReadonlyHandlers);
}

export function isProxy(value) {
  return isReactive(value) || isReadonly(value);
}

function createActiveObject(raw, baseHandler) {
  return new Proxy(raw, baseHandler);
}
