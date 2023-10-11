import { NodeTypes, createVNodeCall } from '../ast';

export function transforElement(node, context) {
  if(node.type === NodeTypes.ELEMENT) {
    return () => {

      // 中间处理层
      const vnodeTag = `'${node.tag}'`;
      const vnodeChildren = node.children[0];
      let vnodeProps;

      node.codegenNode = createVNodeCall(context, vnodeTag, vnodeProps, vnodeChildren);
    }
  }
}