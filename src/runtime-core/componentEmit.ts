import { camelize, toHandlerKey } from '../shared/index';

export function emit(instance, event, ...args) {
  const { props } = instance;
  // props onAdd event -> add

  const handlerName = toHandlerKey(camelize(event));
  const hanlder = props[handlerName];

  hanlder && hanlder(...args);
}