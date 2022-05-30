import { route, Route } from '@sgrud/shell';

describe('@sgrud/shell/router/route', () => {

  class EntryClass extends HTMLElement { }
  class ParentClass extends HTMLElement { }
  class ChildClass extends HTMLElement { }
  class GrandchildClass extends HTMLElement { }
  class UnboundClass extends HTMLElement { }

  customElements.define('entry-class', EntryClass);
  customElements.define('parent-class', ParentClass);
  customElements.define('child-class', ChildClass);
  customElements.define('grandchild-class', GrandchildClass);

  const entry = {
    parent: HTMLElement,
    path: 'entry'
  };

  const parent = {
    path: 'parent',
    children: [
      {
        path: ''
      },
      EntryClass,
      UnboundClass
    ]
  };

  const child = {
    parent: ParentClass,
    path: 'child'
  };

  const grandchild = {
    parent: child,
    path: 'grandchild'
  };

  const unbound = {
    path: 'two'
  };

  describe('applying the decorator', () => {
    Route(entry)(EntryClass);
    Route(parent)(ParentClass);
    Route(child)(ChildClass);
    Route(grandchild)(GrandchildClass);
    Route(unbound)(UnboundClass);

    it('exposes the processed route on the constructor', () => {
      expect((ParentClass as { [route]?: Route })[route]).toMatchObject({
        path: 'parent',
        component: 'parent-class',
        children: [
          {
            path: ''
          },
          {
            path: 'entry',
            component: 'entry-class'
          },
          {
            path: 'child',
            component: 'child-class',
            children: [
              {
                path: 'grandchild',
                component: 'grandchild-class'
              }
            ]
          }
        ]
      });
    });
  });

});
