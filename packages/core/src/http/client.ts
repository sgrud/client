import { Observable } from 'rxjs';
import { ajax, AjaxConfig as Request, AjaxResponse as Response } from 'rxjs/ajax';
import { Linker } from '../linker/linker';
import { Singleton } from '../utility/singleton';
import { HttpProxy } from './proxy';

/**
 * The **HttpHandler** interface enforces the generic *handle* method with
 * [ajax][] compliant typing on the implementing class or object. This contract
 * is used by the [HttpProxy][] to type the next hops in the [HttpClient][]
 * proxy chain.
 *
 * [ajax]: https://rxjs.dev/api/ajax/ajax
 * [HttpClient]: https://sgrud.github.io/client/classes/core.HttpClient
 * [HttpProxy]: https://sgrud.github.io/client/classes/core.HttpProxy
 *
 * @see [HttpClient][]
 */
export interface HttpHandler {

  /**
   * Generic **handle** method enforcing [ajax][] compliant typing. The method
   * signature corresponds to that of the [ajax][] method itself.
   *
   * [ajax]: https://rxjs.dev/api/ajax/ajax
   * [AjaxConfig]: https://rxjs.dev/api/ajax/AjaxConfig
   * [AjaxResponse]: https://rxjs.dev/api/ajax/AjaxResponse
   * [Observable]: https://rxjs.dev/api/index/class/Observable
   *
   * @param request - Requesting [AjaxConfig][].
   * @typeParam T - Response type.
   * @returns [Observable][] of the requested [AjaxResponse][].
   */
  handle<T>(request: Request): Observable<Response<T>>;

}

/**
 * The [Singleton][] **HttpClient** is a thin wrapper around the [ajax][]
 * method. The main function of this wrapper is to pipe all requests through a
 * chain of classes extending the abstract [HttpProxy][] class. Thereby
 * interceptors for various requests can be implemented to, e.g., provide API
 * credentials etc.
 *
 * [ajax]: https://rxjs.dev/api/ajax/ajax
 * [HttpProxy]: https://sgrud.github.io/client/classes/core.HttpProxy
 * [Singleton]: https://sgrud.github.io/client/functions/core.Singleton
 *
 * @decorator [Singleton][]
 *
 * @see [HttpProxy][]
 */
@Singleton<typeof HttpClient>()
export class HttpClient implements HttpHandler {

  /**
   * Fires an HTTP **DELETE** request against the supplied `url` upon
   * subscription.
   *
   * [AjaxResponse]: https://rxjs.dev/api/ajax/AjaxResponse
   * [Observable]: https://rxjs.dev/api/index/class/Observable
   *
   * @param url - Request URL.
   * @typeParam T - Response type.
   * @returns [Observable][] of the requested [AjaxResponse][].
   *
   * @example
   * Fire an HTTP **DELETE** request against `https://example.com`:
   * ```ts
   * import { HttpClient } from '@sgrud/core';
   *
   * HttpClient.delete('https://example.com').subscribe(console.log);
   * ```
   */
  public static delete<T>(url: string): Observable<Response<T>> {
    return this.prototype.handle<T>({ method: 'DELETE', url });
  }

  /**
   * Fires an HTTP **GET** request against the supplied `url` upon subscription.
   *
   * [AjaxResponse]: https://rxjs.dev/api/ajax/AjaxResponse
   * [Observable]: https://rxjs.dev/api/index/class/Observable
   *
   * @param url - Request URL.
   * @typeParam T - Response type.
   * @returns [Observable][] of the requested [AjaxResponse][].
   *
   * @example
   * Fire an HTTP **GET** request against `https://example.com`:
   * ```ts
   * import { HttpClient } from '@sgrud/core';
   *
   * HttpClient.get('https://example.com').subscribe(console.log);
   * ```
   */
  public static get<T>(url: string): Observable<Response<T>> {
    return this.prototype.handle<T>({ method: 'GET', url });
  }

  /**
   * Fires an HTTP **HEAD** request against the supplied `url` upon
   * subscription.
   *
   * [AjaxResponse]: https://rxjs.dev/api/ajax/AjaxResponse
   * [Observable]: https://rxjs.dev/api/index/class/Observable
   *
   * @param url - Request URL.
   * @typeParam T - Response type.
   * @returns [Observable][] of the requested [AjaxResponse][].
   *
   * @example
   * Fire an HTTP **HEAD** request against `https://example.com`:
   * ```ts
   * import { HttpClient } from '@sgrud/core';
   *
   * HttpClient.head('https://example.com').subscribe(console.log);
   * ```
   */
  public static head<T>(url: string): Observable<Response<T>> {
    return this.prototype.handle<T>({ method: 'HEAD', url });
  }

  /**
   * Fires an HTTP **PATCH** request against the supplied `url` containing the
   * supplied `body` upon subscription.
   *
   * [AjaxResponse]: https://rxjs.dev/api/ajax/AjaxResponse
   * [Observable]: https://rxjs.dev/api/index/class/Observable
   *
   * @param url - Request URL.
   * @param body - Request body.
   * @typeParam T - Response type.
   * @returns [Observable][] of the requested [AjaxResponse][].
   *
   * @example
   * Fire an HTTP **PATCH** request against `https://example.com`:
   * ```ts
   * import { HttpClient } from '@sgrud/core';
   *
   * HttpClient.patch('https://example.com', {
   *   bodyContent: 'value'
   * }).subscribe(console.log);
   * ```
   */
  public static patch<T>(url: string, body: unknown): Observable<Response<T>> {
    return this.prototype.handle<T>({ body, method: 'PATCH', url });
  }

  /**
   * Fires an HTTP **POST** request against the supplied `url` containing the
   * supplied `body` upon subscription.
   *
   * [AjaxResponse]: https://rxjs.dev/api/ajax/AjaxResponse
   * [Observable]: https://rxjs.dev/api/index/class/Observable
   *
   * @param url - Request URL.
   * @param body - Request body.
   * @typeParam T - Response type.
   * @returns [Observable][] of the requested [AjaxResponse][].
   *
   * @example
   * Fire an HTTP **POST** request against `https://example.com`:
   * ```ts
   * import { HttpClient } from '@sgrud/core';
   *
   * HttpClient.post('https://example.com', {
   *   bodyContent: 'value'
   * }).subscribe(console.log);
   * ```
   */
  public static post<T>(url: string, body: unknown): Observable<Response<T>> {
    return this.prototype.handle<T>({ body, method: 'POST', url });
  }

  /**
   * Fires an HTTP **PUT** request against the supplied `url` containing the
   * supplied `body` upon subscription.
   *
   * [AjaxResponse]: https://rxjs.dev/api/ajax/AjaxResponse
   * [Observable]: https://rxjs.dev/api/index/class/Observable
   *
   * @param url - Request URL.
   * @param body - Request body.
   * @typeParam T - Response type.
   * @returns [Observable][] of the requested [AjaxResponse][].
   *
   * @example
   * Fire an HTTP **PUT** request against `https://example.com`:
   * ```ts
   * import { HttpClient } from '@sgrud/core';
   *
   * HttpClient.put('https://example.com', {
   *   bodyContent: 'value'
   * }).subscribe(console.log);
   * ```
   */
  public static put<T>(url: string, body: unknown): Observable<Response<T>> {
    return this.prototype.handle<T>({ body, method: 'PUT', url });
  }

  /**
   * Generic **handle** method, enforced by the [HttpHandler][] interface. Main
   * method of the this class. Internally pipes the `request` through all linked
   * classes extending [HttpProxy][].
   *
   * [AjaxConfig]: https://rxjs.dev/api/ajax/AjaxConfig
   * [AjaxResponse]: https://rxjs.dev/api/ajax/AjaxResponse
   * [HttpHandler]: https://sgrud.github.io/client/interfaces/core.HttpHandler
   * [HttpProxy]: https://sgrud.github.io/client/classes/core.HttpProxy
   * [Observable]: https://rxjs.dev/api/index/class/Observable
   *
   * @param request - Requesting [AjaxConfig][].
   * @typeParam T - Response type.
   * @returns [Observable][] of the requested [AjaxResponse][].
   *
   * @example
   * Fire an HTTP custom request against `https://example.com`:
   * ```ts
   * import { HttpClient } from '@sgrud/core';
   *
   * HttpClient.prototype.handle({
   *   method: 'GET',
   *   url: 'https://example.com',
   *   headers: { 'x-example': 'value' }
   * }).subscribe(console.log);
   * ```
   */
  public handle<T>(request: Request): Observable<Response<T>> {
    const proxies = new Linker<typeof HttpProxy>().getAll(HttpProxy);

    return (function handle(next: Request): Observable<Response<any>> {
      return proxies.shift()?.proxy(next, { handle }) || ajax(next);
    })(request);
  }

}
