import { Observable } from 'rxjs';
import { AjaxConfig as Request, AjaxResponse as Response } from 'rxjs/ajax';
import { Provide, provide } from '../super/provide';
import { HttpHandler } from './client';

/**
 * Abstract base class to implement proxies, i.e., HTTP request interceptors, on
 * the client side. By extending this abstract base class and providing the
 * extending class to the {@link Linker}, e.g., by {@link Target}ing it, the
 * respective classes {@link proxy} method will be called with the request
 * details (which could have been modified by a previous HttpProxy) and the next
 * {@link HttpHandler} (which could be the next HttpProxy or the `rxjs/ajax`
 * method), when a request is fired through the {@link HttpClient}.
 *
 * @decorator {@link Provide}
 *
 * @example Simple proxy intercepting `file:` requests.
 * ```ts
 * import type { HttpHandler, HttpProxy } from '@sgrud/core';
 * import { Provider, Target } from '@sgrud/core';
 * import { Observable, of } from 'rxjs';
 * import type { AjaxConfig, AjaxResponse } from 'rxjs/ajax';
 * import { file } from './file';
 *
 * @Target<typeof FileProxy>()
 * export class FileProxy
 *   extends Provider<typeof HttpProxy>('sgrud.core.http.HttpProxy') {
 *
 *   public override proxy<T>(
 *     request: AjaxConfig,
 *     handler: HttpHandler
 *   ): Observable<AjaxResponse<T>> {
 *     if (request.url.startsWith('file:')) {
 *       return of<AjaxResponse<T>>(file);
 *     }
 *
 *     return handler.handle<T>(request);
 *   }
 * }
 * ```
 *
 * @see {@link HttpClient}
 */
@Provide<typeof HttpProxy>()
export abstract class HttpProxy {

  /**
   * Magic string by which this class is provided.
   *
   * @see {@link provide}
   */
  public static readonly [provide]:
  'sgrud.core.http.HttpProxy' = 'sgrud.core.http.HttpProxy';

  /**
   * The overridden proxy method of linked classes extending HttpProxy is called
   * whenever a request is fired through the {@link HttpClient}. The extending
   * class can either pass the `request` to the next `handler`, with or without
   * modifying it, or an interceptor can chose to completely handle a `request`
   * by itself through returning an Observable.
   *
   * @param request - Request.
   * @param handler - Next handler.
   * @typeParam T - Response type.
   * @returns Observable response.
   */
  public abstract proxy<T>(
    request: Request,
    handler: HttpHandler
  ): Observable<Response<T>>;

}
