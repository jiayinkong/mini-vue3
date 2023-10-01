interface ReactiveEffect {
  _fn: any;
}

interface EffectOptions {
  scheduler?: Function;
}

class ReactiveEffect {
  constructor(_fn, public scheduler?) {
    this._fn = _fn;
  }

  run() {
    activeEffect = this;
    return this._fn();
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
    if(effect.scheduler) {
      effect.scheduler();
    } else {
      effect.run();
    }
  }
}

let activeEffect;
export function effect(fn, options?: EffectOptions) {
  const _effect = new ReactiveEffect(fn, options?.scheduler);

  _effect.run();

  return _effect.run.bind(_effect);
}