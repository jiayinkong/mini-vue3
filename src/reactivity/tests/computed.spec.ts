import { reactive } from '../reactive';
import { computed } from '../computed';

describe('computed', () => {
  it('happy path', () => {
    const user = reactive({
      age: 10,
    });
    const age = computed(() => user.age);
    expect(age.value).toBe(10);
  });

  it('should compute lazily', () => {
    const value = reactive({
      foo: 1,
    });
    const getter = jest.fn(() => {
      return value.foo;
    });
    const cValue = computed(getter);

    // lazy
    expect(getter).not.toHaveBeenCalled();

    expect(cValue.value).toBe(1);
    expect(getter).toHaveBeenCalledTimes(1);

    // should not compute
    cValue.value;
    expect(getter).toHaveBeenCalledTimes(1);

    // should not compute until needed
    /**
     * 在这里，通过打断点可知，set 的时候没有找到 depsMap，
     * 是因为上面没有走 track 的逻辑，
     * 因为处于 !isTracking 的状态，即 activeEffect 为 undefined || shouldTrack = false
     * 也就是没有实例化 ReactiveEffect，所以要这个测试通过，需要在computed的时候实例化 ReactiveEffect，去调用 run 方法
     */
    value.foo = 2;
    expect(getter).toHaveBeenCalledTimes(1);

    // now it should be compute again
    /**
     * 当响应式数据发生改变时，再次访问 cValue 的时候，需要开启 dirty，但是第二次再访问（这时响应式数据没变），也还是需要获取缓存值
     * 所以，可以利用 ReactiveEffect的 scheduler 实现
     * scheduler 的原理是：
     * 1. ReactiveEffect被实例化，一开始立即执行 getter，scheduler没被调用
     * 2. 当触发 set -> trigger，scheduler被调用1次，而 getter 不会被触发
     * 
     * 1. 在实例化 ReactiveEffect 的时候，把 scheduler 参数传过去（scheduler也就是一个回调函数）
     * 让 getter 被执行，也就可以走 track 的依赖收集逻辑
     * 2. 响应式数据改变，触发 trigger，执行 scheduler，那么可以在 scheduler 里面设置 dirty = true，开启获取新的 computed value 开关
     * 3. 再次访问 computed value，由于 dirty = true，
     * 这里干了几件事：
     * （1）再次调用了 ReactiveEffect 实例对象的 run 方法，从而执行了 getter，getter 里面是获取响应式数据，所以走了一遍 get 更新了依赖收集
     * （2）把 run 方法的返回值赋给 _value，这样 computed value 获取到的将是最新的响应式数据值
     * （3）关闭 dirty 开关，当再次访问 computed value 而没改变响应式数据的情况下，一直获取的都是缓存起来的上次的 _value
     * 4. 直到再次修改响应式数据值，才重复2-3的操作
     * 
     */
    expect(cValue.value).toBe(2);
    expect(getter).toHaveBeenCalledTimes(2);

    // should not compute again
    cValue.value;
    expect(getter).toHaveBeenCalledTimes(2);
  });
})