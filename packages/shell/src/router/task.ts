import { provide, Provide } from '@sgrud/core';
import { Observable } from 'rxjs';
import { Router } from '../router/router';

/**
 * Abstract base class to implement {@link Router.Task}s. By {@link Target}ing
 * or otherwise providing an implementation of this abstract base class to the
 * {@link Linker}, the implemented {@link handle} method is called whenever a
 * new {@link Router.State} is triggered by navigating. This interceptor-pattern
 * makes complex routing strategies like asynchronous module-retrieval and the
 * like easy to be implemented.
 *
 * @decorator {@link Provide}
 *
 * @example Simple router task stub.
 * ```ts
 * import { Provider, Target } from '@sgrud/core';
 * import type { Router, RouterTask } from '@sgrud/shell';
 * import type { Observable } from 'rxjs';
 *
 * @Target<typeof ExampleRouterTask>()
 * export class ExampleRouterTask
 *   extends Provider<typeof RouterTask>('sgrud.shell.router.RouterTask') {
 *
 *   public override handle(
 *     prev: Router.State,
 *     next: Router.State,
 *     handler: Router.Task
 *   ): Observable<Router.State> {
 *     throw new Error('Stub!');
 *   }
 *
 * }
 * ```
 *
 * @see {@link Route}
 * @see {@link Router}
 */
@Provide<typeof RouterTask>()
export abstract class RouterTask {

  /**
   * Magic string by which this class is provided.
   *
   * @see {@link provide}
   */
  public static readonly [provide]:
  'sgrud.shell.router.RouterTask' = 'sgrud.shell.router.RouterTask';

  /**
   * Abstract handle method, called whenever a new {@link Router.State} should
   * be navigated to. This method provides the possibility to intercept these
   * upcoming states and, e.g., mutate or redirect them.
   *
   * @param prev - Previously active state.
   * @param next - Next state to be activated.
   * @param handler - Next task handler.
   */
  public abstract handle(
    prev: Router.State,
    next: Router.State,
    handler: Router.Task
  ): Observable<Router.State>;

}
