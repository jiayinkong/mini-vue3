import { h, ref } from "../../dist/mini-vue3.esm.js";

export const App = {
  name: "App",
  setup() {
    const count = ref(0);

    const onClick = () => {
      count.value++;
    };

    const props = ref({
      foo: "foo",
      bar: "bar",
    });

    const onChangePropsDemo1 = () => {
      props.value.foo = "new-foo";
    };

    const onChangePropsDemo2 = () => {
      props.value.foo = undefined;
    };

    const onChangePropsDemo3 = () => {
      props.value = {
        foo: "foo",
      };
    };

    return {
      count,
      props,
      onClick,
      onChangePropsDemo1,
      onChangePropsDemo2,
      onChangePropsDemo3,
    };
  },
  render() {
    return h(
      "div",
      {
        id: "app",
        ...this.props,
      },
      [
        h("div", {}, "count" + this.count), // 依赖收集
        h(
          "button",
          {
            onClick: this.onClick,
          },
          "click"
        ),
        h(
          "button",
          {
            onClick: this.onChangePropsDemo1,
          },
          "修改为新的值 new-foo"
        ),
        h(
          "button",
          {
            onClick: this.onChangePropsDemo2,
          },
          "foo 修改为 undefined"
        ),
        h(
          "button",
          {
            onClick: this.onChangePropsDemo3,
          },
          "bar 被删除了"
        ),
      ]
    );
  },
};
