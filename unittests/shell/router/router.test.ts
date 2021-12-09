import { Router } from '@sgrud/shell';

describe('@sgrud/shell/router/router', () => {

  const paths = [
    '/',
    '/1',
    '/2/2',
    '/3/3',
    '/4/',
    '/5/5/5',
    '/6//6',
    '/7/7',
    '/8/8',
    '/9/',
    '/10/10/10',
    '/11//11',
    '/12/12/12',
    '/13//13'
  ] as Router.Path[];

  const routes = [
    { path: '/' },
    { path: '/1' },
    { path: '/2/2' },
    { path: '/3/:p' },
    { path: '/4/:p?' },
    { path: '/5/:p/5' },
    { path: '/6/:p?/6' },
    { path: '/7', children: [{ path: '/7' }] },
    { path: '/8', children: [{ path: '/:p' }] },
    { path: '/9', children: [{ path: '/:p?' }] },
    { path: '/10', children: [{ path: '/:p/10' }] },
    { path: '/11', children: [{ path: '/:p?/11' }] },
    { path: '/12', children: [{ path: '/:p', children: [{ path: '/12' }] }] },
    { path: '/13', children: [{ path: '/:p?', children: [{ path: '/13' }] }] }
  ] as Router.Route[];

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
      params: { }
    },
    {
      route: routes[3],
      params: { p: '3' }
    },
    {
      route: routes[4],
      params: { p: undefined }
    },
    {
      route: routes[5],
      params: { p: '5' }
    },
    {
      route: routes[6],
      params: { p: undefined }
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
        params: { p: '12' },
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
        params: { p: undefined },
        child: {
          route: routes[13].children![0].children![0],
          params: { }
        }
      }
    }
  ] as Router.Route.Segment[];

  describe.each(paths)('matching path %O', (path) => {
    const index = paths.indexOf(path);

    describe.each(routes)('against route %O', (route) => {
      const match = Router.prototype.match(path, route);

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
    const join = Router.prototype.join(segments[index]);

    it('returns the joined segment', () => {
      expect(join).toBe(path);
    });
  });

});
