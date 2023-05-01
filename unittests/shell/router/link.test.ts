import { Router, RouterLink } from '@sgrud/shell';

describe('@sgrud/shell/router/link', () => {

  /*
   * Fixtures
   */

  new Router().add({ path: 'test' }).connect(undefined, '/base/');

  afterEach(() => navigate.mockClear());
  const navigate = jest.spyOn(Router.prototype, 'navigate');

  document.body.innerHTML = '<a href="/test" is="router-link">/base/test</a>';

  /*
   * Unittests
   */

  describe('inserting a router link into the dom', () => {
    const routerLink = document.querySelector<RouterLink>('a[is]')!;

    it('renders the router link component', () => {
      expect(routerLink).toBeInstanceOf(RouterLink);
      expect(routerLink.href).toContain('/base/test');
    });
  });

  describe('dispatching a click event on a router link', () => {
    const routerLink = document.querySelector<RouterLink>('a[is]')!;

    it('invokes the navigate function on the router', () => {
      routerLink.dispatchEvent(new Event('click'));
      expect(navigate).toBeCalledWith('/base/test', '');
    });
  });

  describe('changing the href attribute on a router link', () => {
    const routerLink = document.querySelector<RouterLink>('a[is]')!;

    it('rebases the new href attribute against the router base href', () => {
      routerLink.href = '/done';
      expect(routerLink.href).toContain('/base/done');
    });
  });

});
