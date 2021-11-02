import { Observable } from 'rxjs';
import { ajax, AjaxConfig as Request, AjaxResponse as Response } from 'rxjs/ajax';
import { Linker } from '../linker/linker';
import { Provider } from '../super/provider';
import { Singleton } from '../utility/singleton';
import { HttpProxy } from './proxy';

/**
 * The HttpHandler interface enforces the generic {@link handle} method with
 * `rxjs/ajax` compliant typing on the implementing class or object. Used by
 * {@link HttpProxy} to type the next hops in the proxy chain.
 *
 * @see {@link HttpClient}
 * @see {@link HttpProxy}
 */
export interface HttpHandler {

  /**
   * Generic method enforcing `rxjs/ajax` compliant typing. The method signature
   * corresponds to that of the `rxjs/ajax` method itself.
   *
   * @param request - Request.
   * @typeParam T - Response type.
   * @returns Observable response.
   */
  handle<T>(request: Request): Observable<Response<T>>;

}

/**
 * The HttpClient is a thin wrapper around the `rxjs/ajax` method. The main
 * function of this wrapper is to pipe all requests through a chain of classes
 * extending {@link HttpProxy}. Thereby interceptors for various requests can be
 * implemented to, e.g., provide API credentials etc.
 *
 * @decorator {@link Singleton}
 */
@Singleton<typeof HttpClient>()
export class HttpClient implements HttpHandler {

  /**
   * Fires a `HTTP DELETE` request upon subscription. Shorthand for calling
   * {@link handle} with respective arguments.
   *
   * @param url - Request URL.
   * @typeParam T - Response type.
   * @returns Observable response.
   *
   * @example Fire a `DELETE` request against `https://example.com`.
   * ```ts
   * import { HttpClient } from '@sgrud/core';
   *
   * HttpClient.delete('https://example.com').subscribe(console.log);
   * ```
   *
   * @see {@link handle}
   */
  public static delete<T>(url: string): Observable<Response<T>> {
    return this.prototype.handle<T>({ method: 'DELETE', url });
  }

  /**
   * Fires a `HTTP GET` request upon subscription. Shorthand for calling
   * {@link handle} with respective arguments.
   *
   * @param url - Request URL.
   * @typeParam T - Response type.
   * @returns Observable response.
   *
   * @example Fire a `GET` request against `https://example.com`.
   * ```ts
   * import { HttpClient } from '@sgrud/core';
   *
   * HttpClient.get('https://example.com').subscribe(console.log);
   * ```
   *
   * @see {@link handle}
   */
  public static get<T>(url: string): Observable<Response<T>> {
    return this.prototype.handle<T>({ method: 'GET', url });
  }

  /**
   * Fires a `HTTP HEAD` request upon subscription. Shorthand for calling
   * {@link handle} with respective arguments.
   *
   * @param url - Request URL.
   * @typeParam T - Response type.
   * @returns Observable response.
   *
   * @example Fire a `HEAD` request against `https://example.com`.
   * ```ts
   * import { HttpClient } from '@sgrud/core';
   *
   * HttpClient.head('https://example.com').subscribe(console.log);
   * ```
   *
   * @see {@link handle}
   */
  public static head<T>(url: string): Observable<Response<T>> {
    return this.prototype.handle<T>({ method: 'HEAD', url });
  }

  /**
   * Fires a `HTTP PATCH` request upon subscription. Shorthand for calling
   * {@link handle} with respective arguments.
   *
   * @param url - Request URL.
   * @param body - Request body.
   * @typeParam T - Response type.
   * @returns Observable response.
   *
   * @example Fire a `PATCH` request against `https://example.com`.
   * ```ts
   * import { HttpClient } from '@sgrud/core';
   *
   * HttpClient.patch('https://example.com', {
   *   bodyContent: 'value'
   * }).subscribe(console.log);
   * ```
   *
   * @see {@link handle}
   */
  public static patch<T>(url: string, body: unknown): Observable<Response<T>> {
    return this.prototype.handle<T>({ body, method: 'PATCH', url });
  }

  /**
   * Fires a `HTTP POST` request upon subscription. Shorthand for calling
   * {@link handle} with respective arguments.
   *
   * @param url - Request URL.
   * @param body - Request body.
   * @typeParam T - Response type.
   * @returns Observable response.
   *
   * @example Fire a `POST` request against `https://example.com`.
   * ```ts
   * import { HttpClient } from '@sgrud/core';
   *
   * HttpClient.post('https://example.com', {
   *   bodyContent: 'value'
   * }).subscribe(console.log);
   * ```
   *
   * @see {@link handle}
   */
  public static post<T>(url: string, body: unknown): Observable<Response<T>> {
    return this.prototype.handle<T>({ body, method: 'POST', url });
  }

  /**
   * Fires a `HTTP PUT` request upon subscription. Shorthand for calling
   * {@link handle} with respective arguments.
   *
   * @param url - Request URL.
   * @param body - Request body.
   * @typeParam T - Response type.
   * @returns Observable response.
   *
   * @example Fire a `PUT` request against `https://example.com`.
   * ```ts
   * import { HttpClient } from '@sgrud/core';
   *
   * HttpClient.put('https://example.com', {
   *   bodyContent: 'value'
   * }).subscribe(console.log);
   * ```
   *
   * @see {@link handle}
   */
  public static put<T>(url: string, body: unknown): Observable<Response<T>> {
    return this.prototype.handle<T>({ body, method: 'PUT', url });
  }

  /**
   * Generic handle method, enforced by the {@link HttpHandler} interface. Main
   * method of the HttpClient. Internally pipes the request config through all
   * linked classes extending {@link HttpProxy}.
   *
   * @param request - Request.
   * @typeParam T - Response type.
   * @returns Observable response.
   *
   * @example Fire a custom request against `https://example.com`.
   * ```ts
   * import { HttpClient } from '@sgrud/core';
   *
   * HttpClient.prototype.handle({
   *   method: 'GET',
   *   url: 'https://example.com',
   *   headers: { 'x-example': 'value' }
   * }).subscribe(console.log);
   * ```
   *
   * @see {@link HttpProxy}
   */
  public handle<T>(request: Request): Observable<Response<T>> {
    const linker = new Linker<Provider<HttpProxy>, HttpProxy>();
    const proxies = linker.getAll(HttpProxy as Provider<HttpProxy>);

    return (function handle(next: Request): Observable<Response<any>> {
      return proxies.shift()?.proxy(next, { handle }) ?? ajax(next);
    })(request);
  }

}
