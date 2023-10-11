import { generate } from './codegen';
import { baseParse } from './parse';
import { transform } from './transform';
import { transforElement } from './transforms/transformElement';
import { transformExpression } from './transforms/transformExpression';
import { transformText } from './transforms/transformText';

export function baseCompile(template) {
  const ast = baseParse(template);

  transform(ast, {
    nodeTransforms: [transformExpression, transforElement, transformText]
  });

  return generate(ast);
}