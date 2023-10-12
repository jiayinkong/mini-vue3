import { h } from "../../dist/mini-vue3.esm.js";

export const Foo = {
  name: "Foo",
  setup(props, { emit }) {
    const toAdd = () => {
      console.log("toAdd");
      emit("add", "a", 0);
      emit("add-foo");
    };

    return {
      toAdd,
    };
  },
  render() {
    return h("div", { class: "foo" }, [
      h(
        "button",
        {
          onClick: this.toAdd,
        },
        "buttonAdd"
      ),
    ]);
  },
};
