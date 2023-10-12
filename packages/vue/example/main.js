import { App } from './App.js';
import { createApp } from '../dist/mini-vue3.esm.js';

const rootContainer = document.querySelector('#id');
createApp(App).mount(rootContainer);
