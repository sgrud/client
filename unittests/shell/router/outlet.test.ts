globalThis.HTMLSlotElement = new Proxy(HTMLSlotElement, {
  apply: (_, target, args) => {
    return Reflect.construct(HTMLSlotElement, args, target.constructor);
  }
});

import { Router, RouterOutlet } from '@sgrud/shell';

describe('@sgrud/shell/router/outlet', () => {

  jest.useFakeTimers();
  document.body.innerHTML = '<slot is="router-outlet">';

  describe('inserting a router outlet into the dom', () => {
    const routerOutlet = document.querySelector('slot[is]') as RouterOutlet;

    it('renders the router outlet component', () => {
      expect(routerOutlet).toBeInstanceOf(RouterOutlet);
    });
  });

  describe('inserting a route into the router', () => {
    const navigate = jest.spyOn(Router.prototype, 'navigate');

    it('renders the router outlet component', () => {
      new Router().add({ path: '' }) && jest.runAllTimers();
      expect(navigate).toHaveBeenCalledWith('/', '', true);
    });
  });

});
