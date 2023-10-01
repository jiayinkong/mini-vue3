import { extend } from '../shared';

interface ReactiveEffect {
  _fn: any;
}

interface EffectOptions {
  scheduler?: Function;
  onStop?: Function | undefined;
}

class ReactiveEffect {
  private deps = [];
  private active = true;
  public scheduler?: Function;
  public onStop?: Function;
  constructor(_fn: Function, scheduler) {
    this._fn = _fn;
    this.scheduler = scheduler;
  }
  run() {
    activeEffect = this;
    return this._fn();
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

  if(!activeEffect) return;

  dep.add(activeEffect);
  activeEffect.deps.push(dep);
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
  extend(_effect, options);
  _effect.run();

  const runner: any  = _effect.run.bind(_effect);
  runner.effect = _effect;
  return runner;
}

export function stop(runner: any) {
  runner.effect.stop();
}