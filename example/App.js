import { h } from '../lib/guide-mini-vue.esm.js';
import { Foo } from './Foo.js';

window.slef = null;

export const App = {
  name: 'App',
  render() {
    window.self = this;
    return h('div', { id: 'root' }, [
      h('p', { class: 'red' }, 'Hello'),
      h('p', { class: 'blue' }, 'Mini-vue'),
      h('p', {
        onClick: () => {
          console.log('click');
        },
        onMousedown: () => {
          console.log('mousedown');
        }
      }, this.msg),
      h(Foo, {
        count: 1
      })
    ]);
  },
  setup() {
    return {
      msg: 'j'
    }
  }
}