import { Observable } from 'rxjs';
import { Provide, provide } from '../super/provide';
import { Http } from './http';

/**
 * Abstract **Proxy** base class to implement {@link Http.Request} interceptors,
 * on the client side. By extending this abstract base class and providing the
 * extending class to the {@link Linker}, e.g., by {@link Target}ing it, the
 * class's {@link handle} method will be called with the {@link Http.Request}
 * details (which could have been modified by a previous **Proxy**) and the next
 * {@link Http.Handler}, whenever a request is fired through the {@link Http}
 * class.
 *
 * @decorator {@link Provide}
 *
 * @example
 * Simple **Proxy** intercepting `file:` requests:
 * ```ts
 * import { type Http, Provider, type Proxy, Target } from '@sgrud/core';
 * import { type Observable, of } from 'rxjs';
 * import { file } from './file';
 *
 * ⁠@Target()
 * export class FileProxy
 *   extends Provider<typeof Proxy>('sgrud.core.Proxy') {
 *
 *   public override handle(
 *     request: Http.Request,
 *     handler: Http.Handler
 *   ): Observable<Http.Response> {
 *     if (request.url.startsWith('file:')) {
 *       return of<Http.Response>(file);
 *     }
 *
 *     return handler.handle(request);
 *   }
 *
 * }
 * ```
 *
 * @see {@link Http}
 */
@Provide()
export abstract class Proxy {

  /**
   * Magic string by which this class is {@link provide}d.
   *
   * @see {@link provide}
   */
  public static readonly [provide]: 'sgrud.core.Proxy' = 'sgrud.core.Proxy';

  /**
   * The **handle** method of linked classes extending the {@link Proxy} base
   * class is called whenever an {@link Http.Request} is fired. The extending
   * class can either pass the `request` to the next `handler`, with or without
   * modifying it, or an interceptor can chose to completely handle a `request`
   * by itself through returning an {@link Observable} {@link Http.Response}.
   *
   * @param request - The {@link Http.Request} to be **handle**d.
   * @param handler - The next {@link Http.Handler} to **handle** the `request`.
   * @returns An {@link Observable} of the **handle**d {@link Http.Response}.
   */
  public abstract handle(
    request: Http.Request,
    handler: Http.Handler
  ): Observable<Http.Response>;

}
