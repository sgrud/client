import { route, Route } from '@sgrud/shell';

describe('@sgrud/shell/router/route', () => {

  class ClassOne extends HTMLElement { }
  class ClassTwo extends HTMLElement { }
  class TestClass extends HTMLElement { }

  customElements.define('class-one', ClassOne);
  customElements.define('test-class', TestClass);

  Route({
    path: 'one'
  })(ClassOne);

  Route({
    path: 'two'
  })(ClassTwo);

  Route({
    path: 'test',
    children: [
      {
        path: ''
      },
      ClassOne,
      ClassTwo
    ]
  })(TestClass);

  describe('applying the decorator', () => {
    it('exposes the processed route on the constructor', () => {
      expect((TestClass as { [route]?: Route })[route]).toMatchObject({
        path: 'test',
        component: 'test-class',
        children: [
          {
            path: ''
          },
          {
            path: 'one',
            component: 'class-one'
          }
        ]
      });
    });
  });

});
