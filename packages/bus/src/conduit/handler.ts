import { Singleton, Spawn, Thread } from '@sgrud/utils';
import { from, Observable, switchMap } from 'rxjs';
import ConduitWorkerThread from 'worker:./worker';
import { ConduitWorker } from './worker';

/**
 * String literal helper type. Enforces any assigned string to contain at least
 * three dots. A ConduitHandle represents a domain name in reverse notation.
 *
 * @example Library-wide ConduitHandle.
 * ```ts
 * import { ConduitHandle } from '@sgrud/bus';
 *
 * const sgrudHandle: ConduitHandle = 'io.github.sgrud';
 * ```
 *
 * @see {@link ConduitHandler}
 */
export type ConduitHandle = `${string}.${string}.${string}`;

/**
 * Type of all values emitted by any conduit. Contains the emitted `value` as
 * well as the emitting `handle`. As a {@link ConduitHandle} represents a
 * domain-like hierarchy, it may contain any number of children, whose
 * emittances are merged into their respective parents.
 *
 * @typeParam T - Conduit type.
 *
 * @see {@link ConduitHandler}
 */
export type ConduitValue<T> = {
  handle: ConduitHandle;
  value: T;
};

/**
 * The ConduitHandler is a {@link Singleton} implementing and orchestrating the
 * establishment, transferral and deconstruction of conduits in conjunction with
 * the {@link ConduitWorker} process.
 */
@Singleton<typeof ConduitHandler>((self, [tuples]) => {
  if (tuples) {
    for (const [key, value] of tuples) {
      self.set(key, value);
    }
  }

  return self;
})
export class ConduitHandler {

  /**
   * {@link Spawn}ed worker process and main conduit workhorse. The underlying
   * {@link ConduitWorker} is run inside a `WebWorker` context and handles all
   * published and subscribed conduits and the aggregation of their values
   * depending on their hierarchy.
   *
   * @see {@link ConduitWorker}
   */
  @Spawn(ConduitWorkerThread)
  private static readonly worker: Thread<ConduitWorker>;

  /**
   * Public ConduitHandler constructor. As the ConduitHandler is a transparent
   * {@link Singleton}, calling the `new` operator on it will always yield the
   * same instance. The `new` operator can therefore be used to bulk-publish
   * conduits.
   *
   * @param tuples - List of conduits to publish.
   *
   * @example Set the `'io.github.sgrud.example'` conduit.
   * ```ts
   * import { ConduitHandler } from '@sgrud/bus';
   *
   * new ConduitHandler([
   *   ['io.github.sgrud.example', of('published')]
   * ]);
   * ```
   */
  public constructor(tuples?: [ConduitHandle, Observable<any>][]) {
    if (tuples) {
      for (const [key, value] of tuples) {
        this.set(key, value);
      }
    }
  }

  /**
   * Gets the conduit representing the supplied `handle`. Calling this method
   * yields an Observable originating from the {@link ConduitWorker} which emits
   * all {@link ConduitValue}s published under the supplied `handle`. When
   * getting `'io.github.sgrud'`, all conduits published hierarchically beneath
   * this `handle`, e.g., `'io.github.sgrud.bus.status'`, will also be emitted
   * by the returned Observable.
   *
   * @param handle - Conduit handle.
   * @typeParam T - Conduit type.
   * @returns Observable.
   *
   * @example Get the `'io.github.sgrud'` conduit.
   * ```ts
   * import { ConduitHandler } from '@sgrud/bus';
   *
   * new ConduitHandler().get('io.github.sgrud').subscribe(console.log);
   * ```
   *
   * @see {@link ConduitHandle}
   * @see {@link ConduitValue}
   */
  public get<T>(handle: ConduitHandle): Observable<ConduitValue<T>> {
    return from(ConduitHandler.worker).pipe(
      switchMap((worker) => worker.get(handle)),
      switchMap((value) => value)
    );
  }

  /**
   * Publishes the supplied `conduit` under the supplied `handle`. This method
   * will register the passed Observable  with the {@link ConduitWorker}. When
   * calling `complete` on the Observable source, the `conduit` will
   * self destruct. When overwriting a `conduit` by supplying a previously used
   * `handle`, the previously supplied `conduit` will be unsubscribed.
   *
   * @param handle - Conduit handle.
   * @param conduit - Observable.
   * @typeParam T - Conduit type.
   *
   * @example Set the `'io.github.sgrud.example'` conduit.
   * ```ts
   * import { ConduitHandler } from '@sgrud/bus';
   * import { of } from 'rxjs';
   *
   * new ConduitHandler().set('io.github.sgrud.example', of('published'));
   * ```
   *
   * @see {@link ConduitHandle}
   */
  public set<T>(handle: ConduitHandle, conduit: Observable<T>): void {
    from(ConduitHandler.worker).pipe(
      switchMap((worker) => worker.set(handle, conduit))
    ).subscribe();
  }

}
