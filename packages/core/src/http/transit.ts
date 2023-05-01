import { filter, finalize, map, Observable, Subject, Subscribable, tap } from 'rxjs';
import { Target } from '../linker/target';
import { Provider } from '../super/provider';
import { assign } from '../utility/assign';
import { Singleton } from '../utility/singleton';
import { Symbol } from '../utility/symbols';
import { Http } from './http';
import { Proxy } from './proxy';

/**
 * The {@link Target}ed {@link Singleton} **Transit** class is a built-in
 * {@link Proxy} intercepting all connections opened by the {@link Http} class.
 * This {@link Proxy} implements the `Symbol.observable` pattern, through which
 * it emits an array of all currently open {@link Http.Request}s every time a
 * new {@link Http.Request} is fired or a previously fired {@link Http.Request}
 * completes.
 *
 * @decorator {@link Target}
 * @decorator {@link Singleton}
 *
 * @see {@link Http}
 * @see {@link Proxy}
 */
@Target()
@Singleton()
export class Transit
  extends Provider<typeof Proxy>('sgrud.core.Proxy') {

  /**
   * The **changes** {@link Subject} emits every time a request is added to or
   * deleted from the internal {@link requests} mapping.
   */
  private readonly changes: Subject<this>;

  /**
   * Internal {@link Map}ping of all running requests. Mutating this map should
   * be accompanied by an emittance of the {@link changes} {@link Subject}.
   */
  private readonly requests: Map<Http.Request, Http.Response>;

  /**
   * Public **constructor**. Called by the {@link Target} decorator to link this
   * {@link Proxy} so it may be used by the {@link Http} class.
   */
  public constructor() {
    super();

    this.changes = new Subject<this>();
    this.requests = new Map<Http.Request, Http.Response>();
  }

  /**
   * Well-known `Symbol.observable` method returning a {@link Subscribable}. The
   * returned {@link Subscribable} emits all active {@link Http.Request}s in an
   * array, whenever this list changes. Using the returned {@link Subscribable},
   * e.g., a load indicator can easily be implemented.
   *
   * @returns A {@link Subscribable} emitting all active {@link Http.Request}.
   *
   * @example
   * Subscribe to the currently active {@link Http.Request}:
   * ```ts
   * import { Transit, Linker } from '@sgrud/core';
   * import { from } from 'rxjs';
   *
   * const transit = new Linker<typeof Transit>().get(Transit);
   * from(transit).subscribe(console.log);
   * ```
   */
  public [Symbol.observable](): Subscribable<Http.Response[]> {
    return this.changes.pipe(map(() => Array.from(this.requests.values())));
  }

  /**
   * Overridden **handle** method of the {@link Proxy} base class. Mutates the
   * `request` to also emit progress events while it is running. These progress
   * events will be consumed by the {@link Transit} interceptor and re-supplied
   * via the {@link Subscribable} returned by the `Symbol.observable` method.
   *
   * @param request - The {@link Http.Request} to be **handle**d.
   * @param handler - The next {@link Http.Handler} to **handle** the `request`.
   * @returns An {@link Observable} of the **handle**d {@link Http.Response}.
   */
  public override handle(
    request: Http.Request,
    handler: Http.Handler
  ): Observable<Http.Response> {
    const includeDownloadProgress = !!request.includeDownloadProgress;
    const includeUploadProgress = !!request.includeUploadProgress;

    return handler.handle(assign(request, {
      includeDownloadProgress: true,
      includeUploadProgress: true
    })).pipe(
      tap((event) => {
        this.requests.set(request, event);
        this.changes.next(this);
      }),
      filter((event) => {
        return event.type === 'download_load' ||
          includeDownloadProgress && event.type.startsWith('download_') ||
          includeUploadProgress && event.type.startsWith('upload_');
      }),
      finalize(() => {
        this.requests.delete(request);
        this.changes.next(this);
      })
    );
  }

}
