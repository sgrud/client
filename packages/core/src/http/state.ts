import { BehaviorSubject, filter, finalize, map, observable, Observable, Subscribable, tap } from 'rxjs';
import { AjaxConfig as Request, AjaxResponse as Response } from 'rxjs/ajax';
import { Target } from '../linker/target';
import { Provider } from '../super/provider';
import { Singleton } from '../utility/singleton';
import { HttpHandler } from './client';
import { HttpProxy } from './proxy';

/**
 * Built-in {@link HttpProxy} intercepting all requests fired through the
 * {@link HttpClient}. This proxy implements {@link [observable]}, through which
 * it emits an array of all currently open connections every time a new request
 * is fired or a running request is completed.
 *
 * @decorator {@link Singleton}
 * @decorator {@link Target}
 *
 * @see {@link HttpClient}
 * @see {@link HttpProxy}
 */
@Target<typeof HttpState>()
@Singleton<typeof HttpState>()
export class HttpState
  extends Provider<typeof HttpProxy>('sgrud.core.http.HttpProxy') {

  /**
   * Symbol property typed as callback to a Subscribable. The returned
   * Subscribable emits an array of all active requests whenever this list
   * mutates. Using the returned Subscribable, e.g., a load indicator can easily
   * be implemented.
   *
   * @returns Callback to a Subscribable.
   *
   * @example Subscribe to the currently active requests.
   * ```ts
   * import { HttpState, Linker } from '@sgrud/core';
   * import { from } from 'rxjs';
   *
   * const httpState = new Linker<typeof HttpState>().get(HttpState);
   * from(httpState).subscribe(console.log);
   * ```
   */
  public readonly [Symbol.observable]: () => Subscribable<Response<any>[]>;

  /**
   * BehaviorSubject emitting every time a request is added to or deleted from
   * the internal {@link running} map.
   */
  private readonly changes: BehaviorSubject<this>;

  /**
   * Internal map containing all running requests. Updating this map should
   * always be accompanied by an emittance of the {@link changes}.
   */
  private readonly running: Map<Request, Response<any>>;

  /**
   * `rxjs.observable` interop getter returning a callback to a Subscribable.
   */
  public get [observable](): () => Subscribable<Response<any>[]> {
    return () => this.changes.pipe(map(() => {
      return Array.from(this.running.values());
    }));
  }

  /**
   * Public constructor. Called by the {@link Target} decorator to link this
   * {@link HttpProxy} into the proxy chain.
   */
  public constructor() {
    super();

    this.changes = new BehaviorSubject<this>(this);
    this.running = new Map<Request, Response<any>>();
  }

  /**
   * Overridden {@link proxy} method of the {@link HttpProxy} base class.
   * Mutates the request to also emit progress events while the request is
   * running. These progress events will be consumed by the HttpState
   * interceptor and re-supplied via the Observable returned by the
   * {@link [observable]} getter.
   *
   * @param request - Request.
   * @param handler - Next handler.
   * @typeParam T - Response type.
   * @returns Observable response.
   */
  public override proxy<T>(
    request: Request,
    handler: HttpHandler
  ): Observable<Response<T>> {
    const includeDownloadProgress = request.includeDownloadProgress;
    const includeUploadProgress = request.includeUploadProgress;

    return handler.handle<T>({
      ...request,
      includeDownloadProgress: true,
      includeUploadProgress: true
    }).pipe(
      tap((event) => {
        this.running.set(request, event);
        this.changes.next(this);
      }),
      filter(({ type }) => {
        return Boolean(type.endsWith('_load') ||
          (includeDownloadProgress && type.startsWith('download_')) ||
          (includeUploadProgress && type.startsWith('upload_')));
      }),
      finalize(() => {
        this.running.delete(request);
        this.changes.next(this);
      })
    );
  }

}
