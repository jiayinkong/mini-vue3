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