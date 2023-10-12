import { reactive} from '../src/reactive';
import { effect, stop } from '../src/effect';

describe('effect', () => {
  it('happy path', () => {
    const reactiveObj = reactive({
      age: 10,
    });
    let nextAge;

    effect(() => {
      nextAge = reactiveObj.age + 1
    });
    expect(nextAge).toBe(11);

    // 更新
    reactiveObj.age += 1; 
    expect(nextAge).toBe(12)
  });


  it('should return runner when call effect', () => {
    let foo = 1;
    const runner = effect(() => {
      foo += 1;
      return 'runner';
    });

    expect(foo).toBe(2);

    const r = runner();
    expect(foo).toBe(3);
    expect(r).toBe('runner');
  });

  it('effect scheduler', () => {
    let dummy;
    let run: any;
    const scheduler = vi.fn(() => {
      run = runner;
    });
    const obj = reactive({ foo: 1 });
    const runner = effect(() => {
      dummy = obj.foo;
    }, { scheduler });
    
    // 一开始立即执行effect的fn参数
    expect(dummy).toBe(1);
    // scheduler没被调用
    expect(scheduler).not.toHaveBeenCalled();
    
    // 触发 set -> trigger
    obj.foo++;
    // scheduler被调用1次
    expect(scheduler).toHaveBeenCalledTimes(1);
    // runner没被触发
    expect(dummy).toBe(1);

    // 开始调用runner
    run();
    // effect fn 再次被触发
    expect(dummy).toBe(2);
  });

  it('stop runner', () => {
    let dummy;
    const obj = reactive({ foo: 1 });
    const runner = effect(()=> {
      dummy = obj.foo;
    });
    obj.foo = 2;
    expect(dummy).toBe(2); 
    stop(runner);
    
    obj.foo++; // 已优化
    expect(dummy).toBe(2);
  });

  it('onStop', () => {
    let dummy;
    const obj = reactive({ foo: 1 });
    const onStop = vi.fn();
    const runner = effect(() => {
      dummy = obj.foo;
    }, {
      onStop,
    });

    stop(runner);

    expect(onStop).toHaveBeenCalledTimes(1);
  });
})