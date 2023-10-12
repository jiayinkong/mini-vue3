import { reactive } from '@mini-vue3/reactivity';
import { watchEffect } from '../src/apiWatch';
import { nextTick } from '../src/scheduler';

describe('api: watch', () => {
  it('effect', async () => {
    const state = reactive({ count: 0 });
    let dummy;
    watchEffect(() => {
      dummy = state.count;
    });

    //立即执行 getter
    expect(dummy).toBe(0);

    state.count++;

    // 先等同步 await nextTick 执行完
    await nextTick();
    // 再等在 scheduler 里添加的微任务队列执行完 getter

    expect(dummy).toBe(1);
  });

  it('stopping the watcher (effect)', async() => {
    const state = reactive({ count: 0 });
    let dummy;
    const stop: any = watchEffect(() => {
      dummy = state.count;
    });
    expect(dummy).toBe(0);

    stop();
    state.count++;
    await nextTick();
    // should not update
    expect(dummy).toBe(0);
  });

  it('cleanup registeration (effect)', async() => {
    const state = reactive({ count: 0 });
    const cleanup = vi.fn();
    let dummy;
    const stop: any = watchEffect((onCleanup) => {
      onCleanup(cleanup);
      dummy = state.count;
    });
    //立即执行 getter，onCleanup 内部只是赋值给 cleanup，没有执行函数
    expect(dummy).toBe(0);
    expect(cleanup).toHaveBeenCalledTimes(0);

    state.count++;
    
    // 先等同步 await nextTick 执行完
    await nextTick();
    // 再等 微任务队列执行完 getter

    // 再次调用 getter 后，自上次 cleanup 被赋值，内部判断到存在 cleanup 所以就被执行

    // 所以 cleanup 被执行次数为 1
    expect(cleanup).toHaveBeenCalledTimes(1);

    // 因为 getter 被再次调用，所以 dummy 为 1
    expect(dummy).toBe(1);

    stop();
    expect(cleanup).toHaveBeenCalledTimes(2);
  });
})