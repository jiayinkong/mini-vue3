import { h } from '../lib/guide-mini-vue.esm.js';

export const App = {
  name: 'App',
  render() {
    return h('div', 'Hello' + this.msg);
  },
  setup() {
    return {
      msg: 'j'
    }
  }
}