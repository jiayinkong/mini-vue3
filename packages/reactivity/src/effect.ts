import { extend } from '@mini-vue3/shared';

interface EffectOptions {
  scheduler?: Function;
  onStop?: Function | undefined;
}

let targetMap = new Map();
let activeEffect;
let shouldTrack = false;

export class ReactiveEffect {
  private _fn: Function;
  private active = true;
  public scheduler?: Function;
  public onStop?: Function;
  public deps = [];
  constructor(_fn: Function, scheduler?) {
    this._fn = _fn;
    this.scheduler = scheduler;
  }
  run() {
    if(!this.active) {
      return this._fn();
    }

    // 应该收集
    shouldTrack = true;
    activeEffect = this;
    const r = this._fn();

    // 重置
    shouldTrack = false;

    return r;
  }
  stop() {
    if(this.active) {
      cleanupEffect(this);
      if(this.onStop) {
        this.onStop();
      }
      this.active = false;
    }
  }
}

function cleanupEffect(effect) {
  effect.deps.forEach((dep: any) => {
    dep.delete(effect);
  });
  effect.deps.length = 0;
}

export function track(target, key) {
  if(!isTracking()) return;

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

  trackEffects(dep);
}

export function trackEffects(dep) {
  if(dep.has(activeEffect)) return;

  dep.add(activeEffect);
  activeEffect.deps.push(dep);
}

export function isTracking() {
  return shouldTrack && activeEffect !== undefined;
}

export function trigger(target, key) {
  const depsMap = targetMap.get(target);

  if(!depsMap) {
    return;
  }

  const dep = depsMap.get(key);

  triggerEffects(dep);
}

export function triggerEffects(dep) {
  for(const effect of dep) {
    if(effect.scheduler) {
      effect.scheduler();
    } else {
      effect.run();
    }
  }
}

export function effect(fn, options?: EffectOptions) {
  const _effect = new ReactiveEffect(fn, options?.scheduler);
  extend(_effect, options);
  _effect.run();

  const runner: any  = _effect.run.bind(_effect);
  runner.effect = _effect;
  return runner;
}

export function stop(runner: any) {
  runner.effect.stop();
}