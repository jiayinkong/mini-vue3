import { extend, isObject } from '@mini-vue3/shared';
import { track, trigger } from './effect';
import { ReactiveFlags, reactive, readonly } from './reactive';

const get = createGetter();
const set = createSetter();
const readonlyGet = createGetter(true);
const shallowReadonlyGet = createGetter(true, true);

function createGetter(isReadonly = false, shallow = false) {
  return function get(target, key) {
    if(key === ReactiveFlags.IS_REACTIVE) {
      return !isReadonly;
    }
    if(key === ReactiveFlags.IS_READONLY) {
      return isReadonly;
    }
    const res = Reflect.get(target, key);

    if(isReadonly && shallow) {
      return res;
    }

    // 看看 res 是不是 object
    if(isObject(res)) {
      return isReadonly ? readonly(res) : reactive(res);
    }

    if(!isReadonly) {
      // 依赖收集
      track(target, key);
    }

    return res;
  }
}

function createSetter() {
  return function set(target, key, value) {
    const res = Reflect.set(target, key, value);
    
    // 触发依赖
    trigger(target, key);
    return res;
  }
}

export const mutableHanlders = {
  get,
  set,
}

export const readonlyHandlers = {
  get: readonlyGet,
  set(target, key, value) {
    console.warn('不允许修改');
    return true;
  }
}

export const shallowReadonlyHandlers = extend({}, readonlyHandlers, {
  get: shallowReadonlyGet
})
