import { provide, Provide } from '@sgrud/core';
import { Observable } from 'rxjs';
import { Router } from '../router/router';

/**
 * Abstract base class to implement **RouterTask**s. By [Target][]ing or
 * otherwise providing an implementation of this abstract **RouterTask** base
 * class to the [Linker][], the implemented *handle* method is called whenever a
 * new [State][] is triggered by navigating. This interceptor-like pattern makes
 * complex routing strategies like asynchronous module-retrieval and the similar
 * tasks easy to be implemented.
 *
 * [Linker]: https://sgrud.github.io/client/classes/core.Linker
 * [Provide]: https://sgrud.github.io/client/functions/core.Provide-1
 * [Route]: https://sgrud.github.io/client/functions/shell.Route
 * [Router]: https://sgrud.github.io/client/classes/shell.Router
 * [Target]: https://sgrud.github.io/client/functions/core.Target
 * [State]: https://sgrud.github.io/client/interfaces/shell.Router-1.State
 *
 * @decorator [Provide][]
 *
 * @example
 * Simple **RouterTask** stub:
 * ```ts
 * import type { Router, RouterTask } from '@sgrud/shell';
 * import type { Observable } from 'rxjs';
 * import { Provider, Target } from '@sgrud/core';
 *
 * ⁠@Target<typeof ExampleRouterTask>()
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
 * @see [Route][]
 * @see [Router][]
 */
@Provide<typeof RouterTask>()
export abstract class RouterTask {

  /**
   * Magic string by which this class is [provide][]d.
   *
   * [provide]: https://sgrud.github.io/client/variables/core.provide-2
   *
   * @see [provide][]
   */
  public static readonly [provide]:
  'sgrud.shell.router.RouterTask' = 'sgrud.shell.router.RouterTask' as const;

  /**
   * Abstract **handle** method, called whenever a new [State][] should be
   * navigated to. This method provides the possibility to intercept these
   * upcoming [State][]s and, e.g., mutate or redirect them.
   *
   * [Router]: https://sgrud.github.io/client/classes/shell.Router
   * [State]: https://sgrud.github.io/client/interfaces/shell.Router-1.State
   * [Task]: https://sgrud.github.io/client/interfaces/shell.Router-1.Task
   *
   * @param prev - Previously active [Router][] [State][].
   * @param next - Next [Router][] [State][] to be activated.
   * @param handler - Next [Router][] [Task][] handler.
   * @returns Next handled [Router][] [State][].
   */
  public abstract handle(
    prev: Router.State,
    next: Router.State,
    handler: Router.Task
  ): Observable<Router.State>;

}
