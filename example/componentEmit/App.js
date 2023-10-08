import { Foo } from './Foo.js';
import { h } from '../../lib/guide-mini-vue.esm.js';

export const App = {
  name: 'App',
  setup() {

  },
  render() {
    return h('div', { class: 'app' }, [
      h('h1', {}, 'component emit'),
      h(Foo, {
        onAdd: (a, b) => {
          console.log('emit add', a, b);
        },
        onAddFoo: () => {
          console.log('emit add foo');
        }
      })
    ])
  }
}