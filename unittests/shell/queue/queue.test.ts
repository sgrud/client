import { Linker, Target } from '@sgrud/core';
import { Queue, Router } from '@sgrud/shell';
import { Observable, map, of } from 'rxjs';

describe('@sgrud/shell/queue/queue', () => {

  /*
   * Variables
   */

  @Target()
  class QueueOne extends Queue {

    public override handle(
      _prev: Router.State,
      next: Router.State,
      queue: Router.Queue
    ): Observable<Router.State> {
      if (next.path === 'route' && next.search === '?param=value') {
        return of({
          path: 'one',
          search: '',
          segment: {
            params: {},
            route: {
              path: 'one'
            }
          }
        });
      }

      return queue.handle(next);
    }

  }

  @Target()
  class QueueTwo extends Queue {

    public override handle(): Observable<Router.State> {
      return of({
        path: 'two',
        search: '',
        segment: {
          params: {},
          route: {
            path: 'two'
          }
        }
      });
    }

  }

  new Router().add({
    path: 'route',
    children: [
      {
        path: 'path'
      }
    ]
  });

  /*
   * Unittests
   */

  describe('targeting queue subclasses', () => {
    const linker = new Linker<typeof Queue>();
    const links = linker.getAll(Queue);

    it('appends the targets to the list of router queues', () => {
      expect(links).toContain(linker.get(QueueOne));
      expect(links).toContain(linker.get(QueueTwo));
    });
  });

  describe('invoking the next router state by navigating', () => {
    const navigate = new Router().navigate('route', '?param=value');

    it('loops the next state through the router queue', (done) => {
      navigate.pipe(map((next) => {
        expect(next.path).toBe('one');
      })).subscribe({
        complete: done,
        error: done
      });
    });
  });

  describe('invoking the next router state by navigating', () => {
    const navigate = new Router().navigate('route/path');

    it('loops the next state through the router queue list', (done) => {
      navigate.pipe(map((next) => {
        expect(next.path).toBe('two');
      })).subscribe({
        complete: done,
        error: done
      });
    });
  });

});
