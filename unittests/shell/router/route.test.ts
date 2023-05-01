import { customElements, route, Route } from '@sgrud/shell';

describe('@sgrud/shell/router/route', () => {

  /*
   * Variables
   */

  class RootElement extends HTMLElement {}
  customElements.define('root-element', RootElement);

  class ParentElement extends HTMLElement {}
  customElements.define('parent-element', ParentElement);

  class ChildElement extends HTMLElement {}
  customElements.define('child-element', ChildElement);

  class FinalElement extends HTMLElement {}
  customElements.define('final-element', FinalElement);

  class SlotElement extends HTMLElement {}
  customElements.define('slot-element', SlotElement);

  class UnknownElement extends HTMLElement {}

  const root = {
    parent: HTMLElement,
    path: 'root',
    slots: {
      slot: HTMLElement
    }
  };

  const parent = {
    path: 'parent',
    children: [
      {
        path: ''
      },
      RootElement,
      UnknownElement
    ]
  };

  const child = {
    parent: ParentElement,
    path: 'child',
    slots: {
      slot: SlotElement
    }
  };

  const final = {
    parent: child as any,
    path: 'final',
    slots: {
      slot: 'slot-element' as const
    }
  };

  const unknown = {
    path: 'two'
  };

  /*
   * Unittests
   */

  describe('applying the decorator', () => {
    Route(root)(RootElement);
    Route(parent)(ParentElement);
    Route(child)(ChildElement);
    Route(final)(FinalElement);
    Route(unknown)(UnknownElement);

    it('exposes the processed route on the constructor', () => {
      expect((ParentElement as { [route]?: Route })[route]).toMatchObject({
        path: 'parent',
        component: 'parent-element',
        children: [
          {
            path: ''
          },
          {
            path: 'root',
            component: 'root-element'
          },
          {
            path: 'child',
            component: 'child-element',
            children: [
              {
                path: 'final',
                component: 'final-element'
              }
            ]
          }
        ]
      });
    });
  });

});
