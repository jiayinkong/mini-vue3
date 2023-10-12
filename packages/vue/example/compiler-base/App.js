import { ref } from "../../dist/mini-vue3.esm.js";

export const App = {
  name: "App",
  template: `<div>Hi, {{message}}-{{ count }}</div>`,
  setup() {
    const count = (window.count = ref(0));
    return {
      count,
      message: "mini-vue",
    };
  },
};
