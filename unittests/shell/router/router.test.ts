import { Route, Router } from '@sgrud/shell';
import { catchError, from, map, of, skip } from 'rxjs';

describe('@sgrud/shell/router/router', () => {

  /*
   * Fixtures
   */

  afterEach(() => navigate.mockClear());
  const navigate = jest.spyOn(Router.prototype, 'navigate');

  /*
   * Variables
   */

  const paths = [
    '0',
    '1/1',
    '2/2',
    '3',
    '4/4/4',
    '5/5',
    '6',
    '7/7',
    '8/8',
    '9',
    '10/10/10',
    '11/11',
    '12/12',
    '13/13/13',
    '14/14/14',
    '15/15',
    '16/16'
  ];

  const routes = [
    { path: '0' },
    { path: '1/1' },
    { path: '2/:p' },
    { path: '3/:p?' },
    { path: '4/:p/4' },
    { path: '5/:p?/5' },
    { path: '6', children: [{ path: '' }] },
    { path: '7', children: [{ path: '7' }] },
    { path: '8', children: [{ path: ':p' }] },
    { path: '9', children: [{ path: ':p?' }] },
    { path: '10', children: [{ path: ':p/10' }] },
    { path: '11', children: [{ path: ':p?/11' }] },
    { path: '12', children: [{ path: '', children: [{ path: '12' }] }] },
    { path: '13', children: [{ path: '13', children: [{ path: '13' }] }] },
    { path: '14', children: [{ path: ':p', children: [{ path: '14' }] }] },
    { path: '15', children: [{ path: ':p?', children: [{ path: '15' }] }] },
    { path: '16', children: [{ path: '16', children: [{ path: '' }] }] }
  ] as Route[];

  const segment = {
    params: {},
    route: {
      path: ''
    },
    parent: {
      params: {},
      route: {
        path: 'parent'
      }
    },
    child: {
      params: {},
      route: {
        path: 'child'
      }
    }
  } as Router.Segment;

  const segments = [
    {
      route: routes[0],
      params: {}
    },
    {
      route: routes[1],
      params: {}
    },
    {
      route: routes[2],
      params: { p: '2' }
    },
    {
      route: routes[3],
      params: { p: undefined }
    },
    {
      route: routes[4],
      params: { p: '4' }
    },
    {
      route: routes[5],
      params: { p: undefined }
    },
    {
      route: routes[6],
      params: {},
      child: {
        route: routes[6].children![0],
        params: {}
      }
    },
    {
      route: routes[7],
      params: {},
      child: {
        route: routes[7].children![0],
        params: {}
      }
    },
    {
      route: routes[8],
      params: {},
      child: {
        route: routes[8].children![0],
        params: { p: '8' }
      }
    },
    {
      route: routes[9],
      params: {},
      child: {
        route: routes[9].children![0],
        params: { p: undefined }
      }
    },
    {
      route: routes[10],
      params: {},
      child: {
        route: routes[10].children![0],
        params: { p: '10' }
      }
    },
    {
      route: routes[11],
      params: {},
      child: {
        route: routes[11].children![0],
        params: { p: undefined }
      }
    },
    {
      route: routes[12],
      params: {},
      child: {
        route: routes[12].children![0],
        params: {},
        child: {
          route: routes[12].children![0].children![0],
          params: {}
        }
      }
    },
    {
      route: routes[13],
      params: {},
      child: {
        route: routes[13].children![0],
        params: {},
        child: {
          route: routes[13].children![0].children![0],
          params: {}
        }
      }
    },
    {
      route: routes[14],
      params: {},
      child: {
        route: routes[14].children![0],
        params: { p: '14' },
        child: {
          route: routes[14].children![0].children![0],
          params: {}
        }
      }
    },
    {
      route: routes[15],
      params: {},
      child: {
        route: routes[15].children![0],
        params: { p: undefined },
        child: {
          route: routes[15].children![0].children![0],
          params: {}
        }
      }
    },
    {
      route: routes[16],
      params: {},
      child: {
        route: routes[16].children![0],
        params: {},
        child: {
          route: routes[16].children![0].children![0],
          params: {}
        }
      }
    }
  ] as Router.Segment[];

  const state = {
    path: '',
    search: '',
    segment: {
      params: {},
      route: {
        path: ''
      }
    }
  } as Router.State;

  const tree = {
    path: '',
    component: 'root-component' as const,
    children: [
      {
        path: '',
        component: 'empty-component' as const
      },
      {
        path: 'route',
        component: 'route-component' as const
      }
    ]
  } as Route;

  /*
   * Unittests
   */

  describe('constructing an instance', () => {
    const router = new Router();

    it('returns the singleton instance', () => {
      expect(router).toBe(new Router());
    });
  });

  describe('adding routes to the router set', () => {
    const router = new Router();

    const child = {
      path: 'child',
      component: 'child-component' as const,
      slots: {
        slot: 'slot-component' as const
      }
    };

    const route = {
      path: 'route',
      children: [child]
    };

    router.add(child);
    router.add(route);

    it('adds routes while deduplicating children', () => {
      expect(router.size).toBe(1);
      expect(router.values().next().value).toBe(route);
    });

    it('finds the added routes by component names', () => {
      expect(router.lookup(child.component)).toBe('route/child');
      expect(router.lookup('unknown-component')).toBeUndefined();
    });
  });

  describe('binding the router', () => {
    const router = new Router();
    const htmlDocument = document.implementation.createHTMLDocument();
    const bind = () => router.connect(htmlDocument.body, '/base/', true);

    it('binds the router to the global onpopstate event', () => {
      expect(bind).not.toThrow();

      globalThis.dispatchEvent(new PopStateEvent('popstate', { state }));
      expect(navigate).toBeCalledWith(state.segment, state.search, 'pop');
    });

    it('sets the supplied arguments as properties on the router', () => {
      expect(router.outlet).toBe(htmlDocument.body);
      expect(router.baseHref).toBe('/base/#!/');
      expect(router.hashBased).toBeTruthy();
    });

    it('throws an error when trying to bind again without unbinding', () => {
      expect(bind).toThrowError(ReferenceError);
    });
  });

  describe('dispatching a global onpopstate event', () => {
    const router = new Router();

    it('navigates to the changed location', async() => {
      const url = new URL('/route', location.href);
      const spy = jest.spyOn(globalThis, 'location', 'get');
      spy.mockImplementation(() => url as unknown as Location);
      globalThis.dispatchEvent(new PopStateEvent('popstate'));

      expect(spy).toBeCalled();
      expect(navigate).toBeCalled();
      expect(router.state.path).toBe('route');
    });
  });

  describe('unbinding the router', () => {
    const router = new Router();
    const disconnect = () => router.disconnect();

    it('unbinds the router from the global onpopstate event', () => {
      expect(disconnect).not.toThrow();
      globalThis.dispatchEvent(new PopStateEvent('popstate'));
      expect(navigate).not.toBeCalled();
    });

    it('resets the properties on the router', () => {
      expect(router.outlet).toBe(document.body);
      expect(router.baseHref).toBe('/');
      expect(router.hashBased).toBeFalsy();
    });

    it('throws an error when trying to unbind again without binding', () => {
      expect(disconnect).toThrowError(ReferenceError);
    });
  });

  describe('navigating to a known path', () => {
    const routing = new Router().navigate('route/child');

    it('emits the next state', (done) => {
      routing.pipe(map((next) => {
        expect(next.path).toBe('route/child');
      })).subscribe({
        complete: done,
        error: done
      });
    });
  });

  describe('navigating to a known path with search params', () => {
    const routing = new Router().navigate('route', '?param=value');

    it('emits the next state with search params', (done) => {
      routing.pipe(map((next) => {
        expect(next.path).toBe('route');
        expect(next.search).toBe('?param=value');
      })).subscribe({
        complete: done,
        error: done
      });
    });
  });

  describe('navigating to an unknown path', () => {
    const routing = new Router().navigate('route/unknown').pipe(
      catchError((error) => of(error))
    );

    it('throws an error containing the unknown path', (done) => {
      routing.pipe(map((next) => {
        expect(next).toBeInstanceOf(URIError);
        expect(next.message).toBe('/route/unknown');
      })).subscribe({
        complete: done,
        error: done
      });
    });
  });

  describe('subscribing to the router', () => {
    const router = new Router();

    it('emits the next states', (done) => {
      const changes = from(router).pipe(skip(1), map((next) => {
        expect(next).toBe(router.state);
        expect(next.path).toBe('route/child');
      })).subscribe({
        error: done
      });

      router.navigate('route/child').pipe(map(() => {
        changes.unsubscribe();
      })).subscribe({
        complete: done,
        error: done
      });
    });
  });

  describe('rebasing a path against the router base href', () => {
    const router = new Router();

    it('returns the correctly rebased path', () => {
      expect(router.rebase('route')).toBe('/route');
      expect(router.rebase('/route')).toBe('/route');
      expect(router.rebase('route', false)).toBe('route');
      expect(router.rebase('/route', false)).toBe('route');
    });
  });

  describe('spooling a graph-like segment', () => {
    const router = new Router();

    it('spools the segment to the top-most parent or deepest child', () => {
      expect(router.spool(segment).route.path).toBe('parent');
      expect(router.spool(segment, false).route.path).toBe('child');
    });
  });

  describe('matching within a simple route tree', () => {
    const router = new Router();

    it('matches the empty parts of the tree', () => {
      const match = router.match('', [tree]);

      expect(match!.route.component).toBe('root-component');
      expect(match!.child!.route.component).toBe('empty-component');
    });

    it('matches the tree in-depth', () => {
      const match = router.match('route', [tree]);

      expect(match!.route.component).toBe('root-component');
      expect(match!.child!.route.component).toBe('route-component');
    });
  });

  describe.each(paths)('matching path %O', (path) => {
    const router = new Router();
    const index = paths.indexOf(path);

    describe.each(routes)('against route %O', (route) => {
      const match = router.match(path, [route]);

      if (index === routes.indexOf(route)) {
        it('returns the matched segments', () => {
          expect(match).toMatchObject(segments[index]);
        });
      } else {
        it('returns undefined', () => {
          expect(match).toBeUndefined();
        });
      }
    });
  });

  describe.each(paths)('rejoining path %O', (path) => {
    const router = new Router();
    const index = paths.indexOf(path);

    it('returns the joined segment', () => {
      const join = router.join(segments[index]);

      expect(join).toBe(path);
    });
  });

});
