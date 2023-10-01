import { reactive } from '../reactive';
import { effect } from '../effect';

describe('effect', () => {
  it('happy path', () => {
    const reactiveObj = reactive({
      age: 10,
    });
    let nextAge;

    effect(() => nextAge = reactiveObj.age + 1);
    expect(nextAge).toBe(11);

    // 更新
    reactiveObj.age += 1; 
    expect(nextAge).toBe(12)
  })
})