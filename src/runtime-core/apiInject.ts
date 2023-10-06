import { getCurrentInstance } from './component';

export function provide(key, value) {
  // 存
  const currentIsntance: any = getCurrentInstance();

  if(currentIsntance) {
    let { provides } = currentIsntance;
    const parentProvides = currentIsntance.parent.provides;

    // init
    if(provides === parentProvides) {
      // A = Object.create(B)，把 B 作为 A 的原型，A.__proto__ = B
      // 这里让 currentInstance.provides 继承父实例的 provides，是为了不让父实例的 provides 被修改
      provides = currentIsntance.provides = Object.create(parentProvides);    
    }
    provides[key] = value;
  }
}

export function inject(key, defaultValue) {
  // 取
  const currentIsntance: any = getCurrentInstance();

  if(currentIsntance) {
    const parentProvides = currentIsntance.parent.provides;

    if(key in parentProvides) {
      return parentProvides[key];
    } else if(defaultValue) {
      if(typeof defaultValue === 'function') {
        return defaultValue();
      } else {
        return defaultValue;
      }
    }
  }
}