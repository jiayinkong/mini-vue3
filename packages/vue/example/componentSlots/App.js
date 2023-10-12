import { Foo } from "./Foo.js";
import { h, createTextVNode } from "../../dist/mini-vue3.esm.js";

export const App = {
  name: "App",
  setup() {},
  render() {
    const app = h("div", {}, "app");
    const foo = h(
      Foo,
      {},
      {
        header: ({ age }) => {
          return [
            h("p", {}, "header " + age),
            h("p", {}, "test slots array children " + age),
            createTextVNode("Hello"),
          ];
        },
        footer: () => h("p", {}, "footer"),
      }
    );
    return h("div", {}, [h("h1", {}, "component slots"), app, foo]);
  },
};
