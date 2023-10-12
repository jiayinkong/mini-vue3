import { isObject } from '@mini-vue3/shared';
import {
  mutableHanlders,
  readonlyHandlers,
  shallowReadonlyHandlers,
} from "./basehandlers";

export const enum ReactiveFlags {
  IS_REACTIVE = "__v_isReative",
  IS_READONLY = "__v_isReadonly",
}

export function reactive(raw) {
  return createReactiveObject(raw, mutableHanlders);
}

export function isReactive(value) {
  return !!value[ReactiveFlags.IS_REACTIVE];
}

export function readonly(raw) {
  return createReactiveObject(raw, readonlyHandlers);
}

export function isReadonly(value) {
  return !!value[ReactiveFlags.IS_READONLY];
}

export function shallowReadonly(raw) {
  return createReactiveObject(raw, shallowReadonlyHandlers);
}

export function isProxy(value) {
  return isReactive(value) || isReadonly(value);
}

function createReactiveObject(target, baseHandler) {
  if(!isObject(target)) {
    console.warn(`target ${target} should be a object`);
  }
  return new Proxy(target, baseHandler);
}
