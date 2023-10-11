import { generate } from '../src/codegen';
import { baseParse } from '../src/parse'
import { transform } from '../src/transform';
import { transforElement } from '../src/transforms/transformElement';
import { transformExpression } from '../src/transforms/transformExpression';
import { transformText } from '../src/transforms/transformText';

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

  it('element', () => {
    const ast: any = baseParse('<div>Hi, {{message}}</div>');

    transform(ast, {
      nodeTransforms: [transformExpression, transforElement, transformText]
    });

    const { code } = generate(ast);
  
    expect(code).toMatchSnapshot();
  });
})