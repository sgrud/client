import { provide, Provide } from '@sgrud/core';
import { Observable } from 'rxjs';
import { Router } from '../router/router';

/**
 * Abstract base class to implement {@link Router} **Queue**s. By applying the
 * {@link Target} decorator or otherwise providing an implementation of this
 * abstract **Queue** base class to the {@link Linker}, the implemented
 * {@link handle} method is called whenever a new {@link Router.State} is
 * triggered by navigating. This interceptor-like pattern makes complex routing
 * strategies like asynchronous module-retrieval and the similar tasks easy to
 * be implemented.
 *
 * @decorator {@link Provide}
 *
 * @example
 * Simple **Queue** stub:
 * ```ts
 * import { Provider, Target } from '@sgrud/core';
 * import { type Router, type Queue } from '@sgrud/shell';
 * import { type Observable } from 'rxjs';
 *
 * ⁠@Target()
 * export class ExampleQueue
 *   extends Provider<typeof Queue>('sgrud.shell.Queue') {
 *
 *   public override handle(
 *     prev: Router.State,
 *     next: Router.State,
 *     queue: Router.Queue
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
@Provide()
export abstract class Queue {

  /**
   * Magic string by which this class is {@link provide}d.
   *
   * @see {@link provide}
   */
  public static readonly [provide]: 'sgrud.shell.Queue' = 'sgrud.shell.Queue';

  /**
   * Abstract **handle** method, called whenever a new {@link Router.State}
   * should be {@link Router.navigate}d to. This method provides the possibility
   * to intercept these upcoming {@link Router.State}s and, e.g., mutate or
   * redirect them, i.e., **handle** the navigation.
   *
   * @param prev - The `prev`iously active {@link Router.State}.
   * @param next - The `next` {@link Router.State} {@link Router.navigate}d to.
   * @param queue - The next {@link Queue} to **handle** the navigation.
   * @returns An {@link Observable} of the **handle**d {@link Router.State}.
   */
  public abstract handle(
    prev: Router.State,
    next: Router.State,
    queue: Router.Queue
  ): Observable<Router.State>;

}
