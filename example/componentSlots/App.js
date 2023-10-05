import { Foo } from './Foo.js';
import { h } from '../../lib/guide-mini-vue.esm.js';

export const App = {
  name: 'App',
  setup() {

  },
  render() {
    const app = h('div', {}, 'app');
    const foo = h(
      Foo, 
      {}, 
      {
        header: ({age}) => {
          return [
            h('p', {}, 'header ' + age),
            h('p', {}, 'test slots array children ' + age)
          ]
        },
        footer: () => h('p', {}, 'footer'),
      }
    );
    return h('div', {},
    [
      h('h1', {}, 'component slots'),
      app,
      foo
    ]
    )
  }
}