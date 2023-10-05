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