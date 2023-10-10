export function transform(root, options = {}) {
  const context = createTransformText(root, options);

  // 1.遍历 - 深度优先遍历
  traverseNode(root, context);

  createRootCodegen(root);
}

function createRootCodegen(root) {
  return root.codegenNode = root.children[0];
}

function createTransformText(root, options) {
  const context = {
    root,
    nodeTransforms: options.nodeTransforms || [],
  };

  return context;
}

function traverseNode(node, context) {
  console.log(node);

  const nodeTransforms = context.nodeTransforms;
  for(let i = 0; i < nodeTransforms.length; i++) {
    const transform = nodeTransforms[i];
    transform(node);
  }

  const children = node.children;

  if(children) {
    for(let i = 0; i < children.length; i++) {
      const node = children[i];
      traverseNode(node, context);
    }
  }
}