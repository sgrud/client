import { Router, RouterOutlet } from '@sgrud/shell';
import { from, takeWhile } from 'rxjs';

describe('@sgrud/shell/router/outlet', () => {

  /*
   * Fixtures
   */

  afterEach(() => navigate.mockClear());
  const navigate = jest.spyOn(Router.prototype, 'navigate');

  document.body.innerHTML = '<slot is="router-outlet">';

  /*
   * Unittests
   */

  describe('inserting a router outlet into the dom', () => {
    const routerOutlet = document.querySelector<RouterOutlet>('slot[is]')!;

    it('renders the router outlet component', () => {
      expect(routerOutlet).toBeInstanceOf(RouterOutlet);
    });
  });

  describe('inserting a route into the router', () => {
    const routing = from(new Router().add({ path: '' }));

    it('renders the router outlet component', (done) => {
      routing.pipe(takeWhile((_, index) => {
        switch (index) {
          case 0: expect(navigate).not.toBeCalled(); break;
          case 1: expect(navigate).toBeCalledWith('/', '', 'replace'); break;
        }

        return !index;
      })).subscribe({
        complete: done,
        error: done
      });
    });
  });

});
