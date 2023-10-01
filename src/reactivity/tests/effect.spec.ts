import { reactive } from '../reactive';
import { effect } from '../effect';

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
  })
})