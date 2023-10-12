import { NodeTypes } from './ast';
import { TO_DISPLAY_STRING } from './runtimeHelpers';

export function transform(root, options = {}) {
  const context = createTransformText(root, options);

  // 1.遍历 - 深度优先遍历
  traverseNode(root, context);

  createRootCodegen(root);

  root.helpers = [...context.helpers.keys()];
}

function createRootCodegen(root) {
  root.codegenNode = root.children[0];
  const child = root.children[0];
  if(child.type === NodeTypes.ELEMENT) {
    root.codegenNode = child.codegenNode;
  } else {
    root.codegenNode = root.children[0];
  }
}

function createTransformText(root, options) {
  const context = {
    root,
    nodeTransforms: options.nodeTransforms || [],
    helpers: new Map(),
    helper(key) {
      context.helpers.set(key, 1);
    }
  };

  return context;
}

function traverseNode(node, context) {
  const nodeTransforms = context.nodeTransforms;
  let existFns: any = [];

  for(let i = 0; i < nodeTransforms.length; i++) {
    const transform = nodeTransforms[i];
    const onExist = transform(node, context);
    if(onExist) existFns.push(onExist);
  }

  switch (node.type) {
    case NodeTypes.INTERPOLATION:
      context.helper(TO_DISPLAY_STRING);
      break;

    case NodeTypes.ROOT:
    case NodeTypes.ELEMENT:
      traverseChildren(node, context);
      break;
  
    default:
      break;
  }

  let i = existFns.length;
  while(i--) {
    existFns[i]();
  }
}

function traverseChildren(node, context) {
  const children = node.children;

  for(let i = 0; i < children.length; i++) {
    const node = children[i];
    traverseNode(node, context);
  }
}