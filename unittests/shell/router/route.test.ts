import { customElements, route, Route } from '@sgrud/shell';

describe('@sgrud/shell/router/route', () => {

  class EntryElement extends HTMLElement { }
  class ParentElement extends HTMLElement { }
  class ChildElement extends HTMLElement { }
  class GrandchildElement extends HTMLElement { }
  class SlotElement extends HTMLElement { }
  class UnboundElement extends HTMLElement { }

  customElements.define('entry-element', EntryElement);
  customElements.define('parent-element', ParentElement);
  customElements.define('child-element', ChildElement);
  customElements.define('grandchild-element', GrandchildElement);
  customElements.define('slot-element', SlotElement);

  const entry = {
    parent: HTMLElement,
    path: 'entry',
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
      EntryElement,
      UnboundElement
    ]
  };

  const child = {
    parent: ParentElement,
    path: 'child',
    slots: {
      slot: SlotElement
    }
  };

  const grandchild = {
    parent: child as unknown as Route,
    path: 'grandchild',
    slots: {
      slot: 'slot-element' as CustomElementTagName
    }
  };

  const unbound = {
    path: 'two'
  };

  describe('applying the decorator', () => {
    Route(entry)(EntryElement);
    Route(parent)(ParentElement);
    Route(child)(ChildElement);
    Route(grandchild)(GrandchildElement);
    Route(unbound)(UnboundElement);

    it('exposes the processed route on the constructor', () => {
      expect((ParentElement as { [route]?: Route })[route]).toMatchObject({
        path: 'parent',
        component: 'parent-element',
        children: [
          {
            path: ''
          },
          {
            path: 'entry',
            component: 'entry-element'
          },
          {
            path: 'child',
            component: 'child-element',
            children: [
              {
                path: 'grandchild',
                component: 'grandchild-element'
              }
            ]
          }
        ]
      });
    });
  });

});
