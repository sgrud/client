import { route, Route } from '@sgrud/shell';

describe('@sgrud/shell/router/route', () => {

  class ClassOne extends HTMLElement { }
  class ClassTwo extends HTMLElement { }
  class TestClass extends HTMLElement { }
  class ChildClass extends HTMLElement { }

  customElements.define('class-one', ClassOne);
  customElements.define('test-class', TestClass);
  customElements.define('child-class', ChildClass);

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

  Route({
    path: 'child',
    parent: TestClass
  })(ChildClass);

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
          },
          {
            path: 'child',
            component: 'child-class'
          }
        ]
      });
    });
  });

});
