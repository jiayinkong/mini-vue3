import { generate } from '../src/codegen';
import { baseParse } from '../src/parse'
import { transform } from '../src/transform';

describe('generate', () => {
  it.only('string', () => {
    const ast = baseParse('hiiii');

    transform(ast);

    const { code } = generate(ast);
  
    expect(code).toMatchSnapshot();
  })
})