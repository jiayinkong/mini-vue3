import { createApp } from "../../dist/mini-vue3.esm.js";
import { App } from "./App.js";

const rootContainer = document.querySelector("#root");
createApp(App).mount(rootContainer);
