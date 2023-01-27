globalThis.HTMLAnchorElement = new Proxy(HTMLAnchorElement, {
  apply: (_, target, args) => {
    return Reflect.construct(HTMLAnchorElement, args, target.constructor);
  }
});

import { Mutable } from '@sgrud/core';
import { Router, RouterLink } from '@sgrud/shell';

describe('@sgrud/shell/router/link', () => {

  (new Router().add({ path: 'test' }) as Mutable<Router>).baseHref = '/base/';
  document.body.innerHTML = '<a href="/test" is="router-link">/base/test</a>';

  describe('inserting a router link into the dom', () => {
    const routerLink = document.querySelector('a[is]') as RouterLink;

    it('renders the router link component', () => {
      expect(routerLink).toBeInstanceOf(RouterLink);
      expect(routerLink.href).toContain('/base/test');
    });
  });

  describe('dispatching a click event on a router link', () => {
    const navigate = jest.spyOn(Router.prototype, 'navigate');
    const routerLink = document.querySelector('a[is]') as RouterLink;

    it('invokes the navigate function on the router', () => {
      routerLink.dispatchEvent(new Event('click'));
      expect(navigate).toHaveBeenCalledWith('/base/test', '');
    });
  });

  describe('changing the href attribute on a router link', () => {
    const routerLink = document.querySelector('a[is]') as RouterLink;

    it('rebases the new href attribute against the router base href', () => {
      routerLink.href = '/done';
      expect(routerLink.href).toContain('/base/done');
    });
  });

});
