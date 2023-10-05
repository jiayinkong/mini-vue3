import { Foo } from './Foo.js';
import { h, getCurrentInstance } from '../../lib/guide-mini-vue.esm.js';

export const App = {
  name: 'App',
  setup() {
    const instance = getCurrentInstance();
    console.log(instance);
  },
  render() {
    return h('div', { class: 'app' }, [
      h('h1', {}, 'component currentInstance'),
      h(Foo)
    ])
  }
}