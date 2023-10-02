import { isReadonly, readonly } from '../reactive';

describe('readonly', () => {
  it('happy path', () => {
    const original = { foo: 1, bar: { barz: {} } };
    const wrapped = readonly(original);
    expect(wrapped).not.toBe(original);
    expect(wrapped.foo).toBe(1);
    
    expect(isReadonly(wrapped)).toBe(true);
    expect(isReadonly(original)).toBe(false);

    // 测试嵌套对象也应该是只读
    expect(isReadonly(wrapped.bar)).toBe(true);
    expect(isReadonly(wrapped.bar.barz)).toBe(true);
  });

  it('warn then call set', () => {
    console.warn = jest.fn();
    const user = readonly({ age: 10 });
    user.age = 11;

    expect(console.warn).toBeCalled();
  })
});