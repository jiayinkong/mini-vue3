import { h, renderSlots } from '../../lib/guide-mini-vue.esm.js';

export const Foo = {
  name: 'Foo',
  setup(props, { emit }) {
    return {

    }
  },
  render() {
    const foo = h('p', {}, 'foo');
    const age = 18;
    return h('div', { class: 'foo' }, [
      renderSlots(this.$slots, 'header', { age }),
      foo, 
      renderSlots(this.$slots, 'footer'),
    ]);
  }
}