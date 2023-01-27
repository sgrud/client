import { BusHandle } from '@sgrud/bus';
import { Factor, Provider, Singleton } from '@sgrud/core';
import { Router, RouterTask } from '@sgrud/shell';
import { map, Observable, switchMap } from 'rxjs';
import { StateHandler } from '../handler/handler';
import { Stateful } from '../handler/stateful';
import { Store } from './store';

/**
 * [Stateful]: https://sgrud.github.io/client/functions/state.Stateful
 *
 * @decorator [Stateful][]
 */
@Stateful<typeof RouteStore>(RouteStore.handle, {
  path: undefined!,
  search: undefined!,
  segment: undefined!
}, true)
export class RouteStore extends Store<RouteStore> implements Router.State {

  /**
   *
   */
  public static readonly handle: BusHandle = 'io.github.sgrud.state.route';

  /**
   * Absolute **path** of the [Router][] [State][].
   *
   * [Router]: https://sgrud.github.io/client/classes/shell.Router
   * [State]: https://sgrud.github.io/client/interfaces/shell.Router-1.State
   */
  public readonly path!: string;

  /**
   * **Search** parameters of the [Router][] [State][].
   *
   * [Router]: https://sgrud.github.io/client/classes/shell.Router
   * [State]: https://sgrud.github.io/client/interfaces/shell.Router-1.State
   */
  public readonly search!: string;

  /**
   * [Segment][] of the [Router][] [State][].
   *
   * [Router]: https://sgrud.github.io/client/classes/shell.Router
   * [Segment]: https://sgrud.github.io/client/interfaces/shell.Router-1.Segment
   * [State]: https://sgrud.github.io/client/interfaces/shell.Router-1.State
   */
  public readonly segment!: Router.Segment;

  /**
   * @param state - [Router][] [State][] **navigate**d to.
   * @returns Next [Store][] value.
   *
   * [Router]: https://sgrud.github.io/client/classes/shell.Router
   * [State]: https://sgrud.github.io/client/interfaces/shell.Router-1.State
   * [Store]: https://sgrud.github.io/client/classes/state.Store
   */
  public navigate(state: Router.State): Store.State<this> {
    return { ...this, ...state };
  }

}

/**
 * [Singleton]: https://sgrud.github.io/client/functions/core.Singleton
 *
 * @decorator [Singleton][]
 */
@Singleton<typeof StoreTask>()
export class StoreTask
  extends Provider<typeof RouterTask>('sgrud.shell.router.RouterTask') {

  /**
   * [Factor]: https://sgrud.github.io/client/functions/core.Factor
   *
   * @decorator [Factor][]
   */
  @Factor(() => StateHandler)
  private readonly handler!: StateHandler;

  /**
   * [Router]: https://sgrud.github.io/client/classes/shell.Router
   * [State]: https://sgrud.github.io/client/interfaces/shell.Router-1.State
   * [Task]: https://sgrud.github.io/client/interfaces/shell.Router-1.Task
   *
   * @param _prev - Previously active [Router][] [State][] (ignored).
   * @param next - Next [Router][] [State][] to be activated.
   * @param handler - Next [Router][] [Task][] handler.
   * @returns Next handled [Router][] [State][].
   */
  public override handle(
    _prev: Router.State,
    next: Router.State,
    handler: Router.Task
  ): Observable<Router.State> {
    const store = this.handler.get(RouteStore.handle);

    if (store) {
      return handler.handle(next).pipe(
        switchMap((state) => store.dispatch('navigate', [state]).pipe(
          map(() => state)
        ))
      );
    }

    return handler.handle(next);
  }

}
