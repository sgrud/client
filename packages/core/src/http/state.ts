import { BehaviorSubject, filter, finalize, map, Observable, Subscribable, tap } from 'rxjs';
import { AjaxConfig as Request, AjaxResponse as Response } from 'rxjs/ajax';
import { Target } from '../linker/target';
import { Provider } from '../super/provider';
import { Singleton } from '../utility/singleton';
import { Symbol } from '../utility/symbols';
import { HttpHandler } from './client';
import { HttpProxy } from './proxy';

/**
 * The [Target][]ed [Singleton][] **HttpState** is a built-in [HttpProxy][]
 * intercepting all requests fired through the [HttpClient][]. This proxy
 * implements the [observable][] pattern, through which it emits an array of all
 * currently open connections every time a new request is fired or a previously
 * fired request completes.
 *
 * [HttpClient]: https://sgrud.github.io/client/classes/core.HttpClient
 * [HttpProxy]: https://sgrud.github.io/client/classes/core.HttpProxy
 * [observable]: https://rxjs.dev/api/index/const/observable
 * [Singleton]: https://sgrud.github.io/client/functions/core.Singleton
 * [Target]: https://sgrud.github.io/client/functions/core.Target
 *
 * @decorator [Target][]
 * @decorator [Singleton][]
 *
 * @see [HttpClient][]
 * @see [HttpProxy][]
 */
@Target<typeof HttpState>()
@Singleton<typeof HttpState>()
export class HttpState
  extends Provider<typeof HttpProxy>('sgrud.core.http.HttpProxy') {

  /**
   * [BehaviorSubject][] emitting every time a request is added to or deleted
   * from the internal *running* mapping.
   *
   * [BehaviorSubject]: https://rxjs.dev/api/index/class/BehaviorSubject
   */
  private readonly changes: BehaviorSubject<this>;

  /**
   * Internal mapping containing all running requests. Updating this map should
   * always be accompanied by an emittance of the *changes* [BehaviorSubject][].
   *
   * [BehaviorSubject]: https://rxjs.dev/api/index/class/BehaviorSubject
   */
  private readonly running: Map<Request, Response<any>>;

  /**
   * Symbol property typed as callback to a [Subscribable][]. The returned
   * [Subscribable][] emits an array of all active requests whenever this list
   * changes. Using the returned [Subscribable][], e.g., a load indicator can
   * easily be implemented.
   *
   * [Subscribable]: https://rxjs.dev/api/index/interface/Subscribable
   *
   * @returns Callback to a [Subscribable][].
   *
   * @example
   * Subscribe to the currently active requests:
   * ```ts
   * import { HttpState, Linker } from '@sgrud/core';
   * import { from } from 'rxjs';
   *
   * const httpState = new Linker<typeof HttpState>().get(HttpState);
   * from(httpState).subscribe(console.log);
   * ```
   */
  public get [Symbol.observable](): () => Subscribable<Response<any>[]> {
    return () => this.changes.pipe(
      map(() => Array.from(this.running.values()))
    );
  }

  /**
   * Public **constructor**. Called by the [Target][] decorator to link this
   * [HttpProxy][] into the proxy chain.
   *
   * [HttpProxy]: https://sgrud.github.io/client/classes/core.HttpProxy
   * [Target]: https://sgrud.github.io/client/functions/core.Target
   */
  public constructor() {
    super();

    this.changes = new BehaviorSubject<this>(this);
    this.running = new Map<Request, Response<any>>();
  }

  /**
   * Overridden **proxy** method of the [HttpProxy][] base class. Mutates the
   * `request` to also emit progress events while the it is running. These
   * progress events will be consumed by the [HttpState][] interceptor and
   * re-supplied via the [Subscribable][] returned by the interop getter.
   *
   * [AjaxConfig]: https://rxjs.dev/api/ajax/AjaxConfig
   * [AjaxResponse]: https://rxjs.dev/api/ajax/AjaxResponse
   * [HttpHandler]: https://sgrud.github.io/client/interfaces/core.HttpHandler
   * [HttpProxy]: https://sgrud.github.io/client/classes/core.HttpProxy
   * [HttpState]: https://sgrud.github.io/client/classes/core.HttpState
   * [Observable]: https://rxjs.dev/api/index/class/Observable
   * [Subscribable]: https://rxjs.dev/api/index/interface/Subscribable
   *
   * @param request - Requesting [AjaxConfig][].
   * @param handler - Next [HttpHandler][].
   * @typeParam T - Response type.
   * @returns [Observable][] of the requested [AjaxResponse][].
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
        return Boolean(type === 'download_load' ||
          includeDownloadProgress && type.startsWith('download_') ||
          includeUploadProgress && type.startsWith('upload_'));
      }),
      finalize(() => {
        this.running.delete(request);
        this.changes.next(this);
      })
    );
  }

}
