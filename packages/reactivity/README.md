# 手写 mini-vue - reactivity 篇（一）

reactivity 是关于响应式数据 API 的实现。reactivity 在 vue3 源码中属于独立的一个模块，也是最高层级的一个模块，因为其他模块如 runtime-dom、runtime-core、compiler-core、vue 都直接或间接地依赖于 reactivity，而 reactivity 并不依赖于它们。


![image.png](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/b064a68a48f149e69673f955c4a4b113~tplv-k3u1fbpfcp-watermark.image?)


所以，要实现一个 mini-vue，首先从 reactivity 入手。

在 reactivity 模块中，实现了各种我们常见的响应式数据 API，而在 reactivity 模块内又分别有 reactive、ref、computed 三个模块的实现。

在日常开发中，我们最常用到的响应式 API 便有 `reactive`、`ref`、`computed`，但在源码中，它们也可作为 reactivity 目录下的一个模块来看待，因为它们对于 reactivity 来说是一个个单独的文件存放在 reactivity 目录下，里面分别实现了 `reactive`、`ref`、`computed` 及其相关的其他一些 API。



1. reactive.ts 
- reactive
- readonly
- shallowReadonly
- isReactive
- isReadonly
- isProxy

2. ref.ts
- ref
- isRef
- unRef
- proxyRefs

3. computed.ts
- computed


## reactivity / reactive.ts
### 实现 `createReactiveObject`
`reactive`、`readonly`、`shallowReadonly` 都依赖于 `createReactiveObject`，`createReactiveObject` 通过 `new Proxy` 实现数据响应式。

```ts
function createReactiveObject(target, baseHandler) {
  if(!isObject(target)) {
    console.warn(`target ${target} should be a object`);
  }
  return new Proxy(target, baseHandler);
}
```

> proxy API 
> ```ts
> new proxy(target, {
>  get(target, key) {
>    return Reflect.get(target, key)
>  },
>  set(target, key, value) {
>    return Reflect.set(target, key, value);
>  }
> })
> ```

`createReactiveObject` 接收两个参数，第一个是需要被作为响应式数据的对象，第二个是传给 `proxy` 对象的 handler。

- `reactive` - `mutableHandlers`
- `readonly` - `readonlyHandlers`
- `shallowReadonly` - `shallowReadonlyHandlers`

```ts
// reactive
export function reactive(raw) {
  return createReactiveObject(raw, mutableHanlders);
}

// readonly
export function readonly(raw) {
  return createReactiveObject(raw, readonlyHandlers);
}

// shallowReadonly
export function shallowReadonly(raw) {
  return createReactiveObject(raw, shallowReadonlyHandlers);
}

```

它们分别有自己的 handler 逻辑，这些 handlers 放到 basehanlders 模块中维护。

### 实现 `reactive`
```ts
// basehandlers.ts

const get = createGetter();
const set = createSetter();

function createGetter() {
  return function get(target, key) {
    const res = Reflect.get(target, key);

    // 依赖收集
    track(target, key);

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

// mutableHandlers
export const mutableHanlders = {
  get,
  set,
}
```
以上便是最简的 `reactive` 实现。

如果需要对嵌套对象进行深层次的响应式数据监听，可以继续对 `res` 套用 `reative`：
```ts
function createGetter() {
  return function get(target, key) {
    // const res = Reflect.get(target, key);

    // 继续对嵌套对象进行响应式数据监听
    if(isObject(res)) {
      return reactive(res);
    }

    // // 依赖收集
    // track(target, key);

    return res;
  }
}
```

### 实现 `isReactive`
`isReactive`、`isReadonly` 巧妙地利用了 `proxy` 的特性。

`isReactive` 与 `reactive` 对应的。

假如我们有这样一个例子：
```ts
const reactiveObj = reactive({ count: 0 });
const result = isReactive(reactiveObj);

// 那么 result 为 true
```


代码中，`isReactive` 是这样实现的：
```ts
// reactivity/reactive.ts

export const enum ReactiveFlags {
  IS_REACTIVE = "__v_isReative",
  IS_READONLY = "__v_isReadonly",
}

// isReactive
export function isReactive(value) {
  return !!value[ReactiveFlags.IS_REACTIVE];
}
```

而 `reactive` 是这样的：
```ts
// basehanlders.ts
function createGetter() {
  return function get(target, key) {
    // isReactive
    if(key === ReactiveFlags.IS_REACTIVE) {
      return true;
    }

    // const res = Reflect.get(target, key);

    // // 继续对嵌套对象进行响应式数据监听
    // if(isObject(res)) {
    //   return reactive(res);
    // }

    // // 依赖收集
    // track(target, key);

    // return res;
  }
}
```

对于 `isReactive` 来说，把一个对象 `value` 传给 `isReactive`，它通过访问对象的 `ReactiveFlags.IS_REACTIVE` 属性，来判断是否是一个响应式数据。

假设传给 `isReactive` 的参数 `value` 是一个响应式对象，根据 `createReactiveOject`，`value` 实际上是一个 `proxy` 实例，那么它就有 `proxy` 的特性，其特性便是只要访问了对象的某个属性，就会触发 `proxy` handler 的 `get` 方法，而在 `get` 方法中，可以做一下针对 `key` 的判断，如果 `key === ReactiveFlags.IS_REACTIVE`，那么就对应到了 `isReactive` 中访问的 `key`， 返回 `true` 表示这个是响应式数据。

假设传给 `isReactive` 的参数 `value` 不具有响应式，那么就不具有 `proxy` 的特性，即使 `isReactive` 中访问了对象的某个属性，也不会触发 `proxy` handler 的 `get` 方法。


### 实现 `readonly` & `isReadonly`
`isReadonly` 和 `readonly` 也是同样的原理。

而 `isReadonly` 和 `isReactive` 是非此即彼的关系，所以在判断 `isReactive` 的时候对 `isReadonly` 取反即可，同时深层次的对象也要进行 `readonly`。

```ts
// reactivity/reactive.ts
// readonly
export function readonly(raw) {
  return createReactiveObject(raw, readonlyHandlers);
}
```

```ts
// basehandlers.ts
const readonlyGet = createGetter(true);

export const readonlyHandlers = {
  get: readonlyGet,
  set(target, key, value) {
    console.warn('不允许修改');
    return true;
  }
}

function createGetter(isReadonly = false) {
  return function get(target, key) {
    // isReactive
    if(key === ReactiveFlags.IS_REACTIVE) {
      return !isReadonly;
    }

    // isReadonly
    if(key === ReactiveFlags.IS_READONLY) {
      return isReadonly;
    }

    // const res = Reflect.get(target, key);

    // 继续对嵌套对象进行响应式数据监听
    if(isObject(res)) {
      return isReadonly ? readonly(res) : reactive(res);
    }

    // // 依赖收集
    // track(target, key);

    // return res;
  }
}
```

### 实现 `shallowReadonly`

`shallowReadonly` 是浅层只读的意思。

```ts
// shallowReadonly.spec.ts
const props = shallowReadonly({
  n: {
    foo: 1
  }
});
expect(isReadonly(props)).toBe(true);
expect(isReadonly(props.n)).toBe(false);
```

上面这个例子，一个被 `shallowReadonly` 包裹着的对象，其实就是一个 `new Proxy` 得到的实例，也就是 `props` 是响应式的。

而我们访问 `props.n` 的时候是可以访问得到的，返回的就是 `n` 的值 `{ foo: 1 }`，一个普通对象，而不用继续对其进行嵌套的响应式监听。


所以有：

```ts
// reactive.ts
export function shallowReadonly(raw) {
  return createReactiveObject(raw, shallowReadonlyHandlers);
}
```

```ts
// basehandlers.ts
export const readonlyHandlers = {
  get: readonlyGet,
  set(target, key, value) {
    console.warn('不允许修改');
    return true;
  }
};
export const shallowReadonlyHandlers = extend({}, readonlyHandlers, {
  get: shallowReadonlyGet
});

const shallowReadonlyGet = createGetter(true, true);

function createGetter(isReadonly = false, shallow = false) {
  return function get(target, key) {
    // // isReactive
    // if(key === ReactiveFlags.IS_REACTIVE) {
    //   return !isReadonly;
    // }

    // // isReadonly
    // if(key === ReactiveFlags.IS_READONLY) {
    //   return isReadonly;
    // }

    // const res = Reflect.get(target, key);


    // 如果数据是浅层只读，那么不用做依赖收集和深层监听
    if(isReadonly && shallow) {
      return res;
    }

    // 继续对嵌套对象进行响应式数据监听
    // if(isObject(res)) {
    //   return isReadonly ? readonly(res) : reactive(res);
    // }

    // // 依赖收集
    // track(target, key);

    // return res;
  }
}

```

### 实现 `isProxy`

在 reactive 中，还有一个 API 是 `isProxy`。

>官网的解释是：用于判断对象是否是由 reactive()、readonly()、shallowReactive() 或 shallowReadonly() 创建的代理。

而源码中的实现也非常简单，就是判断一个对象是 `isReactive` 或者 `isReadonly`

```ts
export function isProxy(value) {
  return isReactive(value) || isReadonly(value);
}
```

## reactivity / effect.ts
在什么情况下，我们需要进行依赖收集呢？

假设有数据 `data` 依赖于响应式数据，当响应式数据发生改变的时候，我们便需要同步更新 `data`。

所以需要建立一个依赖收集和触发依赖的机制，当响应式数据属性被访问的时候，进行依赖收集，依赖收集的作用是记录被访问的属性，当将来该属性发生改变时，能通过这个记录，找到这个属性进行依赖更新。

```ts
const reactiveObj = reactive({ age: 10 });
let nextAge;

nextAge = reactiveObj.age + 1;

// nextAge = 11;

// 更新
reactiveObj.age += 1;

// nextAge 没变
// nextAge = 11;
```

这个例子中，`nextAge` 依赖于 `reactiveObj.age`，所以值是 `11`，当 `reactiveObj.age` 更新时，`nextAge` 还是 `11`，但我们希望 `reactiveObj.age` 发生改变时，`nextAge` 也能得到更新，应该怎么做呢？


### 实现 `effect`
在 vue3 中，依赖收集、触发依赖是通过 `effect` 来实现的。我们可以通过 `effect` 来模拟一组数据的依赖变化关系：

```ts
// effect.spec.ts

import { effect } from '../src/effect';

const reactiveObj = reactive({ age: 10 });
let nextAge;

effect(() => {
  nextAge = reactiveObj.age + 1;
});

expect(nextAge).toBe(11);

// 更新
reactiveObj.age += 1;
expect(nextAge).toBe(12);
```

不同于刚才的是，这次把 `nextAge` 与 `reactiveObj.age` 的依赖关系写在了 `effect` 函数参数里，暂且叫这个函数参数为 `fn`。

`effect` 到底干了哪些事呢？

```ts
// effect.ts
let activeEffect;
export class ReactiveEffect {
  constructor(_fn: Function) {
    this._fn = _fn;
  }

  run() {
    activeEffect = this;
    const r = this._fn();

    return r;
  }
}

export function effect(fn) {
  const _effect = new ReactiveEffect(fn);

  // 立即执行 
  _effect.run();
}
```

通过分析上面代码，可以发现，`effect` 被执行，创建了 `ReactiveEffect` 实例，实例的 `run` 方法被立即执行。

在 `run` 方法里，把当前创建的实例对象 `this` 赋值给了全局变量 `activeEffect`，然后执行 `fn`，也就是我们写在 `effect` 函数参数 `fn` 里的代码被执行。

而 `fn` 被执行，里面访问了响应式数据属性，就会触发响应式数据的 `proxy` handler 的 `get` 方法，也就是说，可在这一步进行依赖收集 `track`。

```ts
function createGetter() {
  return function get(target, key) {
    
    // 依赖收集
    track(target, key);

    return Reflect.get(target, key);
  }
}
```

在对一个响应式对象做依赖收集的时候，重要的是找到一对一的关系。例如说：

```ts
const target1 = reactive({ age: 20, name: 'Jerry' });
const target2 = reactive({ age: 20, name: 'Tom' });

let jerry1 = {};
let tom1 = {};
effect(() => {
  jerry1.age = target1.age;
  tom1.name = target2.name;
})
```

像上面这个例子，如果 `effect` 里只有一个响应式对象的时候还好办，只需要建立 `key` -> `dep` 的映射关系即可。（`dep` 表示对 `key` 的依赖收集，觉得抽象没关系，暂且知道它是这么个东西，往后看就明白了）。

```ts
const depsMap = new Map();

const dep;
depsMap.set(key, dep);
```


但是事实上，`effect` 里面可能要监听的响应式对象有多个，而万一这些响应式对象的属性 `key` 名称相同，那么就不好区分了，所以还需要针对 `target` 做区分，也就是需要找到 `target` -> `depsMap` 的映射关系。

```ts
let targetMap = new Map();
targetMap.set(target, depsMap);

const depsMap = new Map();

const dep;
depsMap.set(key, dep);
```

至于 `dep`，存放的便是 `ReactiveEffect` 实例 `effect` 的集合，即依赖集合。

为什么存放的是 `effect` 呢？且为什么得是一个集合呢？

1. 首先，`dep` 存放的是 `effect`， 跟触发依赖有关。在触发依赖的时候，我们希望的是能在响应式属性值变化后，能使依赖数据得到更新，而要实现这个，便是要再次执行一次 `effect` 的 `fn`。
触发依赖时，能通过 `target` 在 `targetMap` 中找到 `depsMap`，再通过 `depsMap` 找到 `key`，从而获取到收集到的依赖集合 `dep`，遍历依赖集合，再次执行 `effect` 实例的 `run` 方法，以更新依赖。

```ts
// basehandlers.ts
function createSetter() {
  return function set(target, key, value) {
    const res = Reflect.set(target, key, value);

    // 触发依赖
    trigger(target, key);

    return res;
  }
}
```

```ts
// effect.ts
export function trigger(target, key) {
  const depsMap = targetMap.get(target);

  if(!depsMap) {
    return;
  }

  // 获取到依赖集合
  const dep = depsMap.get(key);

  triggerEffects(dep);
}

export function triggerEffects(dep) {
  // 遍历依赖
  for(const effect of dep) {
    effect.run();
  }
}
```

2. 其次，`dep` 是一个 `effect` 实例集合。原因又是啥呢？


`activeEffect` 是一个全局变量，在 `effect.ts` 被当成一个模块导入使用时，该全局变量便在 `effect.run` 执行时被初始化为当前的一个 `new ReactiveEffect` 实例。

```ts
class ReactiveEffect {
    constructor(fn) {
        this._fn = fn;
    }
    run() {
        activeEffect = this;
        
        return this._fn();
    }
}

export function effect(fn) {
    const effect = new ReactiveEffect(fn);
    
    effect.run();
}
```


当一个模块中多次调用 `effect`，那么 `activeEffect` 便会得到更新。

而再次对同样的响应式对象进行 `track` 的时候， `dep` 对应的 `effect` 实例不能再是上次的那个了，但也不能把上次的那个覆盖掉，不然就会把上次那个 `effect` 依赖收集丢失了。

比如下面这个例子，有两个 `effect`，我们应该达到的是，两个 `effect` 的依赖关系不互相影响，所以某个 `key` 的 `dep` 与 `activeEffect` 有可能是一对多的关系。

```ts
const target1 = reactive({ age: 20, name: 'Jerry' });
const target2 = reactive({ age: 20, name: 'Tom' });

let jerry1 = {};
let tom1 = {};
effect(() => {
  jerry1.age = target1.age;
  tom1.name = target2.name;
})

let jerry2 = {};
let tom2 = {};

effect(() => {
  jerry2.age = target1.age + 1;
  tom2.name = target2.name;
})
```

但 `dep` 也不能重复，重复的话就会使当前 `effect` 重复执行了。

```ts
const target1 = reactive({ age: 20 });

let jerry1 = {};
let tom1 = {};
effect(() => {
  jerry1.age = target1.age;
  tom1.age = target1.age + 1;
});

target1.age += 10;
```

比如这个例子，在一个 `effect` 里面访问了两次 `target.age`，就会触发两次 `track`。假如 `dep` 重复添加了同样的 `effect`，在响应式数据发生变化后，`dep` 被遍历，执行里面的 `effect.run`，那么 `effect` `fn` 就被执行了两次，但实际上这种情况执行一次 `fn` 就够了。

所以，`dep` 使用了 `Set` 这个不包含重复元素的数据结构存储依赖集合 `effect`。

### 实现依赖收集 `track`

```ts
// effect.ts

let targetMap = new Map();

export function track(target, key) {
  const depsMap = targetMap.get(target);

  if(!depsMap) {
    depsMap = new Map();
    targetMap.set(target, depsMap);
  }

  const dep = depsMap.get(key);

  if(!dep) {
    dep = new Set();
    depsMap.set(key, dep);
  }

  trackEffect(dep);
}

export function trackEffect(dep) {
  if(dep.has(activeEffect)) return;

  dep.add(activeEffect);
}
```

### 实现触发依赖 `trigger`
```ts
// effect.ts
export function trigger(target, key) {
  const depsMap = targetMap.get(target);

  if(!depsMap) {
    return;
  }

  // 获取到依赖集合
  const dep = depsMap.get(key);

  triggerEffects(dep);
}

export function triggerEffects(dep) {
  // 遍历依赖
  for(const effect of dep) {
    effect.run();
  }
}
```

以上说的，大概可以用这么一个图来概括下：

![image.png](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/5ec31c8656044a15a432ef3519768de7~tplv-k3u1fbpfcp-watermark.image?)

### 实现 `effect` 返回 `runner`

在实现 reactivity / stop runner、runtime-core 组件更新时有关键作用。

```ts
class ReactiveEffect {
  constructor(fn) {
    this._fn = fn;
  }
  run() {
    activeEffect = this;
    const r = this._fn();

    return r;
  }
}

export function effect(fn) {
  const _effect = new ReactiveEffect(fn);

  const runner = _effect.run.bind(_effect);
  return runner;
}
```

### 实现 `effect scheduler`
`scheduler` 在 `computed`、`nextTick`、`watchEffect` 等的实现中会有关键作用。

实现原理：
1. 一开始执行 `fn`
2. 响应式数据改变后，触发 `set -> trigger`，`fn` 不执行，而是执行`scheduler`函数
3. 开始调用 `runner`，则 `fn` 再执行
```ts
class ReactiveEffect {
  constructor(fn, scheduler?) {
    this._fn = fn;
    this.scheduler = scheduler;
  }
  run() {
    activeEffect = this;
    const r = this._fn();

    return r;
  }
}

export function effect(fn, options?) {
  const _effect = new ReactiveEffect(fn, {
    scheduler: options?.scheduler
  });

  const runner = _effect.run.bind(_effect);
  return runner;
}

export triggerEffects(dep) {
  for(const effect of dep) {
    if(effect.scheduler) {
      effect.scheduler();
    } else {
      effect.run();
    }
  }
}
```

### 实现 `effect stop`
`effect` 提供了 `stop` API 用于停止 runner，之后再发生数据变化时，清空了触发依赖集合，停止依赖收集。

`effect` 也提供了一个 `onStop` 可选参数，如果 `stop` 了 `effect runner`，且有传 `onStop` 函数参数，那么会执行 `onStop` 函数

```ts
// effect.spec.ts

let dummy;
const obj = reactive({ foo: 1 });
const onStop = jest.fn();

const runner = effect(()=> {
  dummy = obj.foo;
} { onStop });
obj.foo = 2;

expect(dummy).toBe(2); 
stop(runner);
expect(onStop).toHaveBeenCalledTimes(1);

obj.foo++; 
expect(dummy).toBe(2);
```

```ts
let shouldTrack = false; // 解决 ++运算符触发 get -> track 致使 stop 失效的问题

export class ReactiveEffect {
  private _active = true;
  constructor(fn, schduler?) {
    this._fn = fn;
    this.scheduler = scheduler;
  }
  run() {
    // 防止往下走继续对 activeEffect 赋值，防止继续收集依赖
    if(!this._active) {
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

// 清空依赖收集集合
function cleanupEffect(effect) {
  effect.deps.forEach((dep: any) => {
    dep.delete(effect);
  });
  effect.deps.length = 0;
}

export function isTracking() {
  return shouldTrack && activeEffect !== undefined;
}

export function track() {
  if(!isTracking()) return;

  ...
}

export function effect(fn, options) {
  const _effect = new ReactiveEffect(fn, options?.scheduler);
  // 合并 options 到 effect 实例中
  extend(_effect, options);

  const runner = _effect.run.bind(_effect);
  runner.effect = _effect;
  return runner;
}

export function stop() {
  runner.effect.stop();
}
```

`shouldTrack` 的作用是，在 `stop(runner)`后，已经清空依赖集合，
只有在 `run` 再次被调用时，才进行依赖收集。

之后数据发生变化，触发依赖，再次执行 `effect.run()` 才更新依赖。

假如没有 `shouldTrack`，`++运算符` 发生数据变化，首先会触发 `get -> track`，再次进行了依赖收集；接着触发 `set -> trigger`，然后 `effect.run` 再次执行更新依赖，相当于 `stop` 失效。

而加了 `shouldTrack`，只有在 `run` 被调用时，暂时把 `shouldTrack` 开启，才进行依赖收集。这样即使 `++运算符` 首先触发 `get -> track`，在判断了 `shouldTrack = false`后，直接 `return` 掉，不再往下进行依赖收集。

## reactivity / ref.ts
### 实现 `ref`

`ref` 实际上是是一个名为 `RefImpl` 的类实例，只是这个类实例有点点特殊，它是一个带有 `getter` `setter` 的类，属性名为 `value`。

```ts
class RefImpl {
  constructor(value) {
    this._value = value;
  }

  get value() {
    return this._value;
  }

  set value(newValue) {
    this._value = newValue;
  }
}

export function ref(value) {
  return new RefImpl(value);
}
```

这样便明白为啥使用 `ref` 对象的时候，需要访问其 `value` 属性了。

```ts
const a = ref(1);
```

#### 实现依赖收集&触发依赖
`ref` 实现依赖收集和触发依赖，可以看作是当我们访问 `ref` 对象的 `value` 属性的时候，进行的依赖收集和触发依赖。

```ts
// ref.spec.ts
const a = ref(1);
let dummy;
effect(() => {
  dummy = a.value;
});
expect(dummy).toBe(1);
a.value = 2;
expect(dummy).toBe(2);
```

所以：

```ts
// ref.ts
class RefImpl {
  // 存放依赖集合
  private dep = new Set();

  constructor(value) {
    this._value = value;
  }

  get value() {
    // 依赖收集
    trackRefValue(this);
    return this._value;
  }

  set value(newValue) {
    this._value = newValue;

    // 触发依赖
    triggerEffect(this.dep);
  }
}

function trackRefValue(ref) {
  trackEffect(ref.dep);
}
```

```ts
// effect.ts - 复用
function trackEffect() {
  if(dep.has(activeEffect)) return;

  dep.add(activeEffect);
}

function triggerEffect(dep) {
  for(const effect of dep) {
    effect.run();
  }
}
```

但是，`ref` 也可以接收一个对象作为参数，对于参数为对象的情况，可以使用 `reactive` 对其进行包裹，逻辑由 `convert` 实现。让对象参数走 `reactive` 的依赖收集和触发依赖的逻辑。

当修改 `ref` 对象的 `value` 值时，也需要对新值做一下 `convert` 转换。

```ts
// ref.ts

class RefImpl {
  constructor(value) {
    this._value = convert(value);
  }
  get value() {
    return this._value;
  }

  set value(newValue) {
    this._value = convert(newValue);
  }
}

function convert(value) {
  return isObject(value) ? reactive(value) : value;
}
```

只有当新值跟旧值不一样时，才重新赋值和触发依赖。

```ts
class RefImpl {
  constructor(value) {
    this.rawValue = value;
    this._value = convert(value);
  }

  set value(newValue) {
    if(hasChanged(this.rawValue, newValue)) {
      this.rawValue = newValue;
      this._value = convert(newValue);
    }
  }
}
```

## 实现 `isRef`

原理跟 `isReactive`、`isReadonly` 差不多。
```ts

class RefImpl {
  __v_isRef = true;

  constructor(value) {
    
  }
}
export function isRef(ref) {
  return !!ref.__v_isRef;
}
```

## 实现 `unRef`
```ts
export function unRef(ref) {
  return isRef(ref) ? ref.value : ref;
}
```

## 实现 `proxyRefs`
```ts
const user = {
  age: ref(10),
  name: 'jerry' as any,
}
const proxyUser = proxyRefs(user);
```

```ts
export function proxyRefs(objectWithRefs) {
  return new Proxy(objectWithRefs, {
    get(target, key) {
      return unRef(Reflect.get(target, key));
    },
    set(target, key, value) {
      if(isRef(target[key]) && !isRef(value)) {
        return (target[key].value = value);
      } else {
        return Reflect.set(target, key, value);
      }
    }
  })
}
```

## reactivity / computed.ts
### 实现最简 `computed`

```ts
export function computed(getter) {
  return new ComputedImpl(getter);
}

class ComputedImpl {
  constructor(getter) {
    this._getter = getter;
  }
  get value() {
    return this._getter();
  }
}
```

### 实现 `computed 缓存`
功能实现：
1. 不立即执行 `getter`，待访问 `computed value` 时才执行 
2. 再次访问 `computed value`，返回缓存值 `_value`，不执行 `getter`
3. 触发 `set -> trigger`，`getter` 再次执行
4. 只要不再触发 `set -> trigger`，访问 `computed value` 得到的还是缓存值 `_value`

原理：
1. 在 类 `ComputedImpl` 的构造函数方法中，实例化一个 `ReactiveEffect` 对象，`getter` 为 `fn`，实现一开始并不执行 `getter`
2. 设置 `_dirty` 开关，初始值为 `true`，开始访问 `computed value`，触发 `get value`，此时 `_dirty` 开启，执行 `effect.run` 也就是执行 `getter`，然后关闭 `_dirty`
3. 再次访问 `computed value`，由于 `_dirty` 关闭，所以返回缓存值
4. 开始改变响应式数据，触发 `set -> trigger`，这时，利用 `effect 的 scheduler`，不执行 `effect.run` 而是执行 `scheduler`，开启 `_dirty`
5. 再次访问 `computed value`，触发 `get value`，此时 `_dirty`
开启，所以再次执行 `effect.run`，也就是再次执行了 `getter`，然后关闭 `_dirty`
6. 再次访问 `computed value`，由于 `_dirty` 关闭，不会执行 `getter`，返回缓存值 `_value`

```ts
export function computed(getter) {
  return new ComputedImpl(getter);
}

class ComputedImpl {
  _dirty = true;
  constructor(getter) {
    this._effect = new ReactiveEffect(getter, () => {
      if(!this._dirty) {
        this._dirty = true;
      }
    })
  }
  get value() {
    if(this.dirty) {
      this._value = this._effect.run();
      this._dirty = false;
    }

    return this._value;
  }
}
```

以上是 mini-vue 中 reactivity 模块的实现。

