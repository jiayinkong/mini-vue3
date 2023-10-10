import { generate } from '../src/codegen';
import { baseParse } from '../src/parse'
import { transform } from '../src/transform';
import { transformExpression } from '../src/transforms/transformExpression';

describe('generate', () => {
  it('string', () => {
    const ast = baseParse('hiiii');

    transform(ast);

    const { code } = generate(ast);
  
    expect(code).toMatchSnapshot();
  });

  it('inperpolation', () => {
    const ast = baseParse('{{message}}');

    transform(ast, {
      nodeTransforms: [transformExpression]
    });

    const { code } = generate(ast);
  
    expect(code).toMatchSnapshot();
  });
})