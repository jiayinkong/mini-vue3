interface ReactiveEffect {
  _fn: any;
}

class ReactiveEffect {
  constructor(_fn) {
    this._fn = _fn;
  }

  run() {
    activeEffect = this;
    this._fn();
  }
}

let targetMap = new Map();
export function track(target, key) {
  // target -> key -> deps
  let depsMap = targetMap.get(target);

  if(!depsMap) {
    depsMap = new Map();
    targetMap.set(target, depsMap);
  }

  let dep = depsMap.get(key);
  if(!dep) {
    dep = new Set();
    depsMap.set(key, dep);
  }
  dep.add(activeEffect);
}

export function trigger(target, key) {
  const depsMap = targetMap.get(target);
  const dep = depsMap.get(key);

  for(const effect of dep) {
    effect.run();
  }
}

let activeEffect;
export function effect(fn) {
  const _effect = new ReactiveEffect(fn);

  _effect.run();
}