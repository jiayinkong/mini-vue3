import { h } from "../../dist/mini-vue3.esm.js";

export default {
  name: "Child",
  setup(props, { emit }) {
    return {
      msg: props.msg,
    };
  },
  render() {
    return h("div", {}, [
      h("div", {}, "child - props - msg: " + this.msg),
      h("div", {}, "child - $props - msg: " + this.$props.msg),
    ]);
  },
};
