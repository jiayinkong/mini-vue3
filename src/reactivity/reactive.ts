import {
  mutableHanlders,
  readonlyHandlers,
} from './basehandlers';

export function reactive(raw) {
  return createActiveObject(raw, mutableHanlders);
}

export function readonly(raw) {
  return createActiveObject(raw, readonlyHandlers);
}

function createActiveObject(raw, baseHandler) {
  return new Proxy(raw, baseHandler);
}
