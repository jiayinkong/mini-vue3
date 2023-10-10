export function generate(ast) {
  const context = createCodegenContext();
  let { push } = context;

  let functionName = 'render';
  let args = ['_ctx', '_cache'];
  let signature = args.join(', ');

  push(`function ${functionName}(${signature}){`);

  push('return ');
  getNode(ast.codegenNode, context);
  push('}');

  return {
    code: context.code,
  }
}

function createCodegenContext() {
  const context = {
    code: '',
    push(source) {
      context.code += source;
    }
  }

  return context;
}

function getNode(node, context) {
  const { push } = context;
  push(`'${node.content}'`);
}