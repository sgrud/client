import { Route, Router } from '@sgrud/shell';
import { catchError, from, of, skip } from 'rxjs';

describe('@sgrud/shell/router/router', () => {

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
    params: { },
    route: {
      path: ''
    },
    parent: {
      params: { },
      route: {
        path: 'parent'
      }
    },
    child: {
      params: { },
      route: {
        path: 'child'
      }
    }
  } as Router.Segment;

  const segments = [
    {
      route: routes[0],
      params: { }
    },
    {
      route: routes[1],
      params: { }
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
      params: { },
      child: {
        route: routes[6].children![0],
        params: { }
      }
    },
    {
      route: routes[7],
      params: { },
      child: {
        route: routes[7].children![0],
        params: { }
      }
    },
    {
      route: routes[8],
      params: { },
      child: {
        route: routes[8].children![0],
        params: { p: '8' }
      }
    },
    {
      route: routes[9],
      params: { },
      child: {
        route: routes[9].children![0],
        params: { p: undefined }
      }
    },
    {
      route: routes[10],
      params: { },
      child: {
        route: routes[10].children![0],
        params: { p: '10' }
      }
    },
    {
      route: routes[11],
      params: { },
      child: {
        route: routes[11].children![0],
        params: { p: undefined }
      }
    },
    {
      route: routes[12],
      params: { },
      child: {
        route: routes[12].children![0],
        params: { },
        child: {
          route: routes[12].children![0].children![0],
          params: { }
        }
      }
    },
    {
      route: routes[13],
      params: { },
      child: {
        route: routes[13].children![0],
        params: { },
        child: {
          route: routes[13].children![0].children![0],
          params: { }
        }
      }
    },
    {
      route: routes[14],
      params: { },
      child: {
        route: routes[14].children![0],
        params: { p: '14' },
        child: {
          route: routes[14].children![0].children![0],
          params: { }
        }
      }
    },
    {
      route: routes[15],
      params: { },
      child: {
        route: routes[15].children![0],
        params: { p: undefined },
        child: {
          route: routes[15].children![0].children![0],
          params: { }
        }
      }
    },
    {
      route: routes[16],
      params: { },
      child: {
        route: routes[16].children![0],
        params: { },
        child: {
          route: routes[16].children![0].children![0],
          params: { }
        }
      }
    }
  ] as Router.Segment[];

  const state = {
    path: '',
    search: '',
    segment: {
      params: { },
      route: {
        path: ''
      }
    }
  } as Router.State;

  const tree = {
    path: '',
    component: 'root' as CustomElementTagName,
    children: [
      {
        path: '',
        component: 'empty' as CustomElementTagName
      },
      {
        path: 'route',
        component: 'route' as CustomElementTagName
      }
    ]
  } as Route;

  describe('instantiating a router', () => {
    const router = new Router();

    it('returns the singleton router', () => {
      expect(router).toBe(new Router());
    });
  });

  describe('adding routes to the router set', () => {
    const router = new Router();
    const child = {
      path: 'child',
      component: 'child-component' as CustomElementTagName,
      slots: {
        slot: 'slot-component' as CustomElementTagName
      }
    };
    const route = {
      path: 'route',
      children: [child]
    };

    router.add(child);
    router.add(route);

    it('adds routes while deduplicating children', () => {
      expect(router.values().next().value).toBe(route);
      expect(router.size).toBe(1);
    });
  });

  describe('binding the router', () => {
    const router = new Router();
    const doc = document.implementation.createHTMLDocument();
    const spy = jest.spyOn(router, 'navigate');

    it('binds the router to the window.onpopstate event', () => {
      router.bind(doc.body, '/base/', true);
      window.dispatchEvent(new PopStateEvent('popstate', { state }));
      expect(spy).toHaveBeenCalledWith(state.segment, state.search);
    });

    it('sets the supplied arguments as properties on the router', () => {
      expect(router.outlet).toBe(doc.body);
      expect(router.baseHref).toBe('/base/#!/');
      expect(router.hashBased).toBe(true);
    });

    it('throws an error when trying to bind again without unbinding', () => {
      expect(() => router.bind()).toThrowError(ReferenceError);
    });
  });

  describe('unbinding the router', () => {
    const router = new Router();
    const spy = jest.spyOn(router, 'navigate');

    it('unbinds the router from the window.onpopstate event', () => {
      router.unbind();
      window.dispatchEvent(new PopStateEvent('popstate'));
      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('resets the properties on the router', () => {
      expect(router.outlet).toBe(document.body);
      expect(router.baseHref).toBe('/');
      expect(router.hashBased).toBe(false);
    });

    it('throws an error when trying to unbind again without binding', () => {
      expect(() => router.unbind()).toThrowError(ReferenceError);
    });
  });

  describe('navigating to a known path', () => {
    const router = new Router();

    it('emits the next state', (done) => {
      router.navigate('route/child').subscribe((next) => {
        expect(next.path).toBe('route/child');
        done();
      });
    });
  });

  describe('navigating to a known path with search params', () => {
    const router = new Router();

    it('emits the next state with search params', (done) => {
      router.navigate('route', '?param=value').subscribe((next) => {
        expect(next.path).toBe('route');
        expect(next.search).toBe('?param=value');
        done();
      });
    });
  });

  describe('navigating to an unknown path', () => {
    const router = new Router();

    it('throws an URIError containing the unknown path', (done) => {
      router.navigate('route/unknown').pipe(
        catchError((error) => of(error))
      ).subscribe((error) => {
        expect(error).toBeInstanceOf(URIError);
        expect(error.message).toBe('/route/unknown');
        done();
      });
    });
  });

  describe('subscribing to the router', () => {
    const router = new Router();

    it('emits the next states', (done) => {
      const subscription = from(router).pipe(skip(1)).subscribe((next) => {
        expect(next).toBe(router.state);
        expect(next.path).toBe('route/child');
        subscription.unsubscribe();
      });

      subscription.add(done);
      router.navigate('route/child').subscribe();
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
      expect(match?.route.component).toBe('root');
      expect(match?.child?.route.component).toBe('empty');
    });

    it('matches the tree in-depth', () => {
      const match = router.match('route', [tree]);
      expect(match?.route.component).toBe('root');
      expect(match?.child?.route.component).toBe('route');
    });
  });

  describe.each(paths)('matching path %O', (path) => {
    const index = paths.indexOf(path);

    describe.each(routes)('against route %O', (route) => {
      const match = new Router().match(path, [route]);

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
    const index = paths.indexOf(path);
    const join = new Router().join(segments[index]);

    it('returns the joined segment', () => {
      expect(join).toBe(path);
    });
  });

});
