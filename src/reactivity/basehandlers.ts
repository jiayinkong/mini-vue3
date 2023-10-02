import { track, trigger } from './effect';

const get = createGetter();
const set = createSetter();
const readonlyGet = createGetter(true);

function createGetter(isReadOnly = false) {
  return function get(target, key) {
    const res = Reflect.get(target, key);

    if(!isReadOnly) {
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
