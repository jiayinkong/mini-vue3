import { isObject } from '../shared';
import { track, trigger } from './effect';
import { ReactiveFlags, reactive, readonly } from './reactive';

const get = createGetter();
const set = createSetter();
const readonlyGet = createGetter(true);

function createGetter(isReadonly = false) {
  return function get(target, key) {
    if(key === ReactiveFlags.IS_REACTIVE) {
      return !isReadonly;
    }
    if(key === ReactiveFlags.IS_READONLY) {
      return isReadonly;
    }
    const res = Reflect.get(target, key);

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
