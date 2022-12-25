import { Linker, Target } from '@sgrud/core';
import { Router, RouterTask } from '@sgrud/shell';
import { Observable, of } from 'rxjs';

describe('@sgrud/shell/router/task', () => {

  @Target<typeof TaskOne>()
  class TaskOne extends RouterTask {
    public override handle(
      _prev: Router.State,
      next: Router.State,
      handler: Router.Task
    ): Observable<Router.State> {
      if (next.path === 'route' && next.search === '?param=value') {
        return of({
          path: 'one',
          search: '',
          segment: {
            params: { },
            route: {
              path: 'one'
            }
          }
        });
      }

      return handler.handle(next);
    }
  }

  @Target<typeof TaskTwo>()
  class TaskTwo extends RouterTask {
    public override handle(): Observable<Router.State> {
      return of({
        path: 'two',
        search: '',
        segment: {
          params: { },
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

  describe('targeting RouterTask subclasses', () => {
    const linker = new Linker<typeof RouterTask>();
    const tasks = linker.getAll(RouterTask);

    it('appends the targets to the list of router tasks', () => {
      expect(tasks).toContain(linker.get(TaskOne));
      expect(tasks).toContain(linker.get(TaskTwo));
    });
  });

  describe('invoking the next router state by navigating', () => {
    const router = new Router();

    it('loops the next state through the router task', (done) => {
      router.navigate('route', '?param=value').subscribe((value) => {
        expect(value.path).toBe('one');
        done();
      });
    });
  });

  describe('invoking the next router state by navigating', () => {
    const router = new Router();

    it('loops the next state through the router task list', (done) => {
      router.navigate('route/path').subscribe((value) => {
        expect(value.path).toBe('two');
        done();
      });
    });
  });

});
