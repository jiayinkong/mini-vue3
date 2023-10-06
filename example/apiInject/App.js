import { h, provide, inject } from '../../lib/guide-mini-vue.esm.js';

const Provider = {
  name: 'Provider',
  setup() {
    provide('foo', 'fooVal');
    provide('bar', 'barVal');
  },
  render() {
    return h('p', { class: 'provider' }, [
      h('h1', {}, 'Provider'),
      h(ProviderTwo)
    ]);
  }
}

const ProviderTwo = {
  name: 'ProviderTwo',
  setup() {
    provide('foo', 'fooTwo');
    const foo = inject('foo');

    return {
      foo,
    }
  },
  render() {
    return h('p', {}, [
      h('h1', {}, 'ProviderTwo'),
      h('p', {}, `foo: ${this.foo}`),
      h(Consumer)
    ])
  }
}

const Consumer = {
  name: 'Consumer',
  setup() {
    const foo = inject('foo');
    const bar = inject('bar');
    const baz = inject('baz', 'bazDefault');
    const baz2 = inject('baz', () => 'bazDefault2');


    return {
      foo,
      bar,
      baz,
      baz2,
    }
  },
  render() {
    return h('p', { class: 'consumer' }, [
      h('h1', {}, 'Consumer'),
      h('p', {}, `${this.foo}-${this.bar}`),
      h('p', {}, this.baz),
      h('p', {}, this.baz2),
    ])
  }
}

export const App = {
  name: 'App',
  setup() {
    return {}
  },
  render() {
    return h('div', { class: 'app' }, [
      h('h1', {}, 'App'),
      h(Provider)
    ]);
  }
}