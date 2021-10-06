import { BehaviorSubject, filter, finalize, map, Observable, tap } from 'rxjs';
import { AjaxConfig as Request, AjaxResponse as Response } from 'rxjs/ajax';
import { Target } from '../linker/target';
import { HttpHandler } from './client';
import { HttpProxy } from './proxy';

/**
 * Built-in {@link HttpProxy} intercepting all requests fired through the
 * {@link HttpClient}. This proxy provides an Observable, emitting an array of
 * all currently active {@link requests} every time a new request is fired or a
 * running request is completed.
 *
 * @decorator {@link Target}
 *
 * @see {@link HttpClient}
 * @see {@link HttpProxy}
 */
@Target()
export class HttpState extends HttpProxy {

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
   * Getter returning an Observable emitting an array of all active requests.
   * Utilizing the returned Observable, e.g., a load indicator can easily be
   * implemented.
   *
   * @example Subscribe to the currently active requests.
   * ```ts
   * import { HttpState, Linker } from '@sgrud/bus';
   *
   * const httpState = new Linker<typeof HttpState, HttpState>().get(HttpState);
   * httpState.requests.subscribe(console.log);
   * ```
   */
  public get requests(): Observable<Response<any>[]> {
    return this.changes.pipe(map(() => Array.from(this.running.values())));
  }

  /**
   * Public HttpState constructor. Called by the {@link Target} decorator to
   * link this {@link HttpProxy} into the proxy chain.
   */
  public constructor() {
    super();

    this.changes = new BehaviorSubject<this>(this);
    this.running = new Map<Request, Response<any>>();
  }

  /**
   * Overridden {@link HttpProxy} proxy method. Mutates the request to also emit
   * progress events while the request is running. These progress events will be
   * consumed by the HttpState interceptor and re-supplied via the Observable
   * returned by the {@link requests} getter.
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
        return Boolean(type?.endsWith('_load') ||
          (includeDownloadProgress && type?.startsWith('download_')) ||
          (includeUploadProgress && type?.startsWith('upload_')));
      }),
      finalize(() => {
        this.running.delete(request);
        this.changes.next(this);
      })
    );
  }

}
