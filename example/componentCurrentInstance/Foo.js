import { h, getCurrentInstance } from '../../lib/guide-mini-vue.esm.js';

export const Foo = {
  name: 'Foo',
  setup(props, { emit }) {
    const instance = getCurrentInstance();
    console.log(instance);

    return {

    }
  },
  render() {
    return h('div', { class: 'foo' }, 'foo')
  }
}

/** 9
 * 
 * 
 * provides: parent.provide 
 * 
 * // provide(key, value)
 * const { provides } = instance
 * provides[key] = value
 * 
 * 
 * // inject(key)
 * const { parent } = instance
 * return parent.provides[key]
 * 
 * 
 * Two-instance.provides[key] = 'fooTwo' provides = parent.provides = { foo: 'fooTwo' }
 * Two-foo = fooTwo
 * 
 * Two-fooTwo
 * Consumer-fooTwo
 */
