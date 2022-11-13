import { Observable } from 'rxjs';
import { AjaxConfig as Request, AjaxResponse as Response } from 'rxjs/ajax';
import { Provide, provide } from '../super/provide';
import { HttpHandler } from './client';

/**
 * Abstract **HttpProxy** base class to implement proxies, i.e., HTTP request
 * interceptors, on the client side. By extending this abstract base class and
 * providing the extending class to the [Linker][], e.g., by [Target][]ing it,
 * the respective classes *proxy* method will be called with the request details
 * (which could have been modified by a previous **HttpProxy**) and the next
 * [HttpHandler][] (which could be the next **HttpProxy** or the [ajax][]
 * method), whenever a request is fired through the [HttpClient][].
 *
 * [ajax]: https://rxjs.dev/api/ajax/ajax
 * [HttpClient]: https://sgrud.github.io/client/classes/core.HttpClient
 * [HttpHandler]: https://sgrud.github.io/client/interfaces/core.HttpHandler
 * [Linker]: https://sgrud.github.io/client/classes/core.Linker
 * [Provide]: https://sgrud.github.io/client/functions/core.Provide-1
 * [Target]: https://sgrud.github.io/client/functions/core.Target
 *
 * @decorator [Provide][]
 *
 * @example
 * Simple **HttpProxy** intercepting `file:` requests:
 * ```ts
 * import type { HttpHandler, HttpProxy } from '@sgrud/core';
 * import type { AjaxConfig, AjaxResponse } from 'rxjs/ajax';
 * import { Provider, Target } from '@sgrud/core';
 * import { Observable, of } from 'rxjs';
 * import { file } from './file';
 *
 * ⁠@Target<typeof FileProxy>()
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
 * @see [HttpClient][]
 */
@Provide<typeof HttpProxy>()
export abstract class HttpProxy {

  /**
   * Magic string by which this class is [provide][]d.
   *
   * [provide]: https://sgrud.github.io/client/variables/core.provide-2
   *
   * @see [provide][]
   */
  public static readonly [provide]:
  'sgrud.core.http.HttpProxy' = 'sgrud.core.http.HttpProxy';

  /**
   * The **proxy** method of linked classes extending the [HttpProxy][] base
   * class is called whenever a request is fired through the [HttpClient][]. The
   * extending class can either pass the `request` to the next `handler`, with
   * or without modifying it, or an interceptor can chose to completely handle a
   * `request` by itself through returning an [Observable][] [AjaxResponse][].
   *
   * [AjaxConfig]: https://rxjs.dev/api/ajax/AjaxConfig
   * [AjaxResponse]: https://rxjs.dev/api/ajax/AjaxResponse
   * [HttpClient]: https://sgrud.github.io/client/classes/core.HttpClient
   * [HttpHandler]: https://sgrud.github.io/client/interfaces/core.HttpHandler
   * [HttpProxy]: https://sgrud.github.io/client/classes/core.HttpProxy
   * [Observable]: https://rxjs.dev/api/index/class/Observable
   *
   * @param request - Requesting [AjaxConfig][].
   * @param handler - Next [HttpHandler][].
   * @typeParam T - Response type.
   * @returns [Observable][] of the requested [AjaxResponse][].
   */
  public abstract proxy<T>(
    request: Request,
    handler: HttpHandler
  ): Observable<Response<T>>;

}
