import { Observable } from 'rxjs';
import { ajax, AjaxConfig, AjaxResponse } from 'rxjs/ajax';
import { Linker } from '../linker/linker';
import { Alias } from '../typing/alias';
import { Proxy } from './proxy';

/**
 * The **Http** namespace contains types and interfaces used and intended to be
 * used in conjunction with the abstract {@link Http} class.
 *
 * @see {@link Http}
 */
export namespace Http {

  /**
   * The **Request** type alias references the {@link AjaxConfig} interface and
   * describes the shape of any {@link Http} **Request** parameters.
   */
  export type Request = Alias<AjaxConfig>;

  /**
   * The **Response** type alias references the {@link AjaxResponse} class and
   * describes the shape of any {@link Http} **Response**.
   *
   * @typeParam T - The **Response** type of a {@link Request}.
   */
  export type Response<T = any> = Alias<AjaxResponse<T>>;

  /**
   * The **Handler** interface enforces the {@link handle} method with
   * {@link ajax} compliant typing on the implementing class or object. This
   * contract is used by the {@link Proxy} to type-guard the next hops.
   */
  export interface Handler {

    /**
     * Generic **handle** method enforcing {@link ajax} compliant typing. The
     * method signature corresponds to that of the {@link ajax} method itself.
     *
     * @param request - Requesting {@link Request}.
     * @returns An {@link Observable} of the requested {@link Response}.
     */
    handle(request: Request): Observable<Response>;

  }

}

/**
 * The abstract **Http** class is a thin wrapper around the {@link ajax} method.
 * The main function of this wrapper is to pipe all requests through a chain of
 * classes extending the abstract {@link Proxy} class. Thereby interceptors for
 * various requests can be implemented to, e.g., provide API credentials etc.
 *
 * @see {@link Proxy}
 */
export abstract class Http implements Http.Handler {

  /**
   * Fires an {@link Http} **delete** request against the supplied `url` upon
   * subscription.
   *
   * @param url - The `url` to {@link Http} **delete**.
   * @typeParam T - The {@link Http.Response} type.
   * @returns An {@link Observable} of the {@link Http.Response}.
   *
   * @example
   * Fire an HTTP **delete** request against `https://example.com`:
   * ```ts
   * import { Http } from '@sgrud/core';
   *
   * Http.delete('https://example.com').subscribe(console.log);
   * ```
   */
  public static delete<T>(url: string): Observable<Http.Response<T>> {
    return this.prototype.handle<T>({ method: 'DELETE', url });
  }

  /**
   * Fires an {@link Http} **get** request against the supplied `url` upon
   * subscription.
   *
   * @param url - The `url` to {@link Http} **get**.
   * @typeParam T - The {@link Http.Response} type.
   * @returns An {@link Observable} of the {@link Http.Response}.
   *
   * @example
   * Fire an HTTP **GET** request against `https://example.com`:
   * ```ts
   * import { Http } from '@sgrud/core';
   *
   * Http.get('https://example.com').subscribe(console.log);
   * ```
   */
  public static get<T>(url: string): Observable<Http.Response<T>> {
    return this.prototype.handle<T>({ method: 'GET', url });
  }

  /**
   * Fires an {@link Http} **head** request against the supplied `url` upon
   * subscription.
   *
   * @param url - The `url` to {@link Http} **head**.
   * @typeParam T - The {@link Http.Response} type.
   * @returns An {@link Observable} of the {@link Http.Response}.
   *
   * @example
   * Fire an HTTP **head** request against `https://example.com`:
   * ```ts
   * import { Http } from '@sgrud/core';
   *
   * Http.head('https://example.com').subscribe(console.log);
   * ```
   */
  public static head<T>(url: string): Observable<Http.Response<T>> {
    return this.prototype.handle<T>({ method: 'HEAD', url });
  }

  /**
   * Fires an {@link Http} **patch** request against the supplied `url`
   * containing the supplied `body` upon subscription.
   *
   * @param url - The `url` to {@link Http} **patch**.
   * @param body - The `body` of the {@link Http.Request}.
   * @typeParam T - The {@link Http.Response} type.
   * @returns An {@link Observable} of the {@link Http.Response}.
   *
   * @example
   * Fire an HTTP **patch** request against `https://example.com`:
   * ```ts
   * import { Http } from '@sgrud/core';
   *
   * Http.patch('https://example.com', {
   *   data: 'value'
   * }).subscribe(console.log);
   * ```
   */
  public static patch<T>(
    url: string,
    body: unknown
  ): Observable<Http.Response<T>> {
    return this.prototype.handle<T>({ body, method: 'PATCH', url });
  }

  /**
   * Fires an {@link Http} **post** request against the supplied `url`
   * containing the supplied `body` upon subscription.
   *
   * @param url - The `url` to {@link Http} **post**.
   * @param body - The `body` of the {@link Http.Request}.
   * @typeParam T - The {@link Http.Response} type.
   * @returns An {@link Observable} of the {@link Http.Response}.
   *
   * @example
   * Fire an HTTP **post** request against `https://example.com`:
   * ```ts
   * import { Http } from '@sgrud/core';
   *
   * Http.post('https://example.com', {
   *   data: 'value'
   * }).subscribe(console.log);
   * ```
   */
  public static post<T>(
    url: string,
    body: unknown
  ): Observable<Http.Response<T>> {
    return this.prototype.handle<T>({ body, method: 'POST', url });
  }

  /**
   * Fires an {@link Http} **put** request against the supplied `url` containing
   * the supplied `body` upon subscription.
   *
   * @param url - The `url` to {@link Http} **put**.
   * @param body - The `body` of the {@link Http.Request}.
   * @typeParam T - The {@link Http.Response} type.
   * @returns An {@link Observable} of the {@link Http.Response}.
   *
   * @example
   * Fire an HTTP **put** request against `https://example.com`:
   * ```ts
   * import { Http } from '@sgrud/core';
   *
   * Http.put('https://example.com', {
   *   data: 'value'
   * }).subscribe(console.log);
   * ```
   */
  public static put<T>(
    url: string,
    body: unknown
  ): Observable<Http.Response<T>> {
    return this.prototype.handle<T>({ body, method: 'PUT', url });
  }

  /**
   * Fires a custom {@link Http.Request}. Use this method for more fine-grained
   * control over the outgoing {@link Http.Request}.
   *
   * @param request - The {@link Http.Request} to be **request**ed.
   * @typeParam T - The {@link Http.Response} type.
   * @returns An {@link Observable} of the {@link Http.Response}.
   *
   * @example
   * Fire an HTTP custom request against `https://example.com`:
   * ```ts
   * import { Http } from '@sgrud/core';
   *
   * Http.request({
   *   method: 'GET',
   *   url: 'https://example.com',
   *   headers: { 'x-example': 'value' }
   * }).subscribe(console.log);
   * ```
   */
  public static request<T>(
    request: Http.Request
  ): Observable<Http.Response<T>> {
    return this.prototype.handle(request);
  }

  /**
   * Private **constructor** (which should never be called).
   *
   * @throws A {@link TypeError} upon construction.
   */
  private constructor() {
    throw new TypeError('Http.constructor');
  }

  /**
   * Generic **handle** method, enforced by the {@link Http.Handler} interface.
   * Main method of the this class. Internally pipes the `request` through all
   * linked classes extending {@link Proxy}.
   *
   * @param request - The {@link Http.Request} to be **handle**d.
   * @typeParam T - The type of the **handle**d {@link Http.Response}.
   * @returns An {@link Observable} of the {@link Http.Response}.
   */
  public handle<T>(request: Http.Request): Observable<Http.Response<T>> {
    const proxies = new Linker<typeof Proxy>().getAll(Proxy);

    return (function handle(next: Http.Request): Observable<Http.Response<T>> {
      return proxies.shift()?.handle(next, { handle }) || ajax(next);
    })(request);
  }

}
