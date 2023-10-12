import { NodeTypes } from './ast';

export function isText(child) {
  return child.type === NodeTypes.TEXT || child.type === NodeTypes.INTERPOLATION;
}