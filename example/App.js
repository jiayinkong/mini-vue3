import { h } from '../lib/guide-mini-vue.esm.js';

export const App = {
  name: 'App',
  render() {
    return h('div', { id: 'root' }, [
      h('p', { class: 'red' }, 'Hello'),
      h('p', { class: 'blue' }, 'Mini-vue')
    ]);
  },
  setup() {
    return {
      msg: 'j'
    }
  }
}