import { h, ref, nextTick, getCurrentInstance } from '../../lib/guide-mini-vue.esm.js';

export const App = {
  name: 'App',
  setup() {
    const count = ref(1);
    const instance = getCurrentInstance();
    const changeCount = () => {
      for(let i = 0; i < 100; i++) {
        console.log('update');
        count.value = i;
      }

      debugger;
      console.log(instance);
      nextTick(() => {
        console.log(instance);
      })
    }

    return {
      count,
      changeCount,
    }
  },
  render() {
    return h('div', {}, [
      h('div', {}, '你好'),
      h(
        'button',
        {
          onClick: this.changeCount,
        },
        'change count',
      ),
      h('p', {}, 'count' + this.count),
    ])
  }
}