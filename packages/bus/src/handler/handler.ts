import { Singleton, Spawn, Thread } from '@sgrud/core';
import { from, Observable, switchMap } from 'rxjs';
import { BusWorker } from '../worker';
import { name } from '../worker/package.json';

/**
 * The **BusHandle** is a string literal helper type which enforces any assigned
 * value to contain at least three dots. It represents a type constraint which
 * should be thought of as domain name in reverse notation. All **BusHandle**s
 * thereby designate a hierarchical structure, which the [BusHandler][] in
 * conjunction with the [BusWorker][] operate upon.
 *
 * [BusHandler]: https://sgrud.github.io/client/classes/bus.BusHandler
 * [BusWorker]: https://sgrud.github.io/client/classes/bus.BusWorker
 *
 * @example
 * Library-wide **BusHandle**:
 * ```ts
 * import { BusHandle } from '@sgrud/bus';
 *
 * const busHandle: BusHandle = 'io.github.sgrud';
 * ```
 *
 * @example
 * An invalid **BusHandle**:
 * ```ts
 * import { BusHandle } from '@sgrud/bus';
 *
 * const busHandle: BusHandle = 'org.example';
 * // Type [...] is not assignable to type 'BusHandle'.
 * ```
 *
 * @see [BusHandler][]
 */
export type BusHandle = `${string}.${string}.${string}`;

/**
 * The **BusValue** is an interface describing the shape of all values emitted
 * by any bus. As busses are [Observable][] streams, which are dynamically
 * merged through their hierarchical structure and therefore may emit more than
 * one `value` from more than one `handle`, each value emitted by any bus
 * contains its originating `handle` and its typed internal `value`.
 *
 * [BusHandler]: https://sgrud.github.io/client/classes/bus.BusHandler
 * [Observable]: https://rxjs.dev/api/index/class/Observable
 *
 * @typeParam T - Bus type.
 *
 * @example
 * Logging emitted **BusValue**s.
 * ```ts
 * import { BusHandler } from '@sgrud/bus';
 *
 * const busHandler = new BusHandler();
 * busHandler.get('io.github.sgrud').subscribe(console.log);
 * // { handle: 'io.github.sgrud.example', value: 'published' }
 * ```
 *
 * @see [BusHandler][]
 */
export interface BusValue<T> {

  /**
   * Emitting [BusHandle][].
   *
   * [BusHandle]: https://sgrud.github.io/client/types/bus.BusHandle
   */
  readonly handle: BusHandle;

  /**
   * Emitted `value`.
   */
  readonly value: T;

}

/**
 * The **BusHandler** is a [Singleton][] class, implementing and orchestrating
 * the establishment, transferral and deconstruction of busses in conjunction
 * with the [BusWorker][] process. To designate different busses, the string
 * literal helper type [BusHandle][] is employed. As an example, let the
 * following hierarchical structure be given:
 *
 * ```text
 * io.github.sgrud
 * ├── io.github.sgrud.core
 * │   ├── io.github.sgrud.core.httpState
 * │   └── io.github.sgrud.core.kernel
 * ├── io.github.sgrud.data
 * │   ├── io.github.sgrud.data.model.current
 * │   └── io.github.sgrud.data.model.global
 * └── io.github.sgrud.shell
 *     └── io.github.sgrud.shell.route
 * ```
 *
 * Depending on the [BusHandle][], one may subscribe to all established busses
 * beneath the root `io.github.sgrud` handle or only to a specific bus, e.g.,
 * `io.github.sgrud.core.kernel`. The resulting [Observable][] will either emit
 * all values passed through all busses with their corresponding [BusHandle][]s,
 * or only the specific scoped values, corresponding to the [BusHandle][].
 *
 * [BusHandle]: https://sgrud.github.io/client/types/bus.BusHandle
 * [BusWorker]: https://sgrud.github.io/client/classes/bus.BusWorker
 * [Observable]: https://rxjs.dev/api/index/class/Observable
 * [Singleton]: https://sgrud.github.io/client/functions/core.Singleton
 *
 * @decorator [Singleton][]
 *
 * @see [BusWorker][]
 */
@Singleton<typeof BusHandler>((self, [tuples]) => {
  if (tuples) {
    for (const [key, value] of tuples) {
      self.set(key, value);
    }
  }

  return self;
})
export class BusHandler {

  /**
   * [Spawn][]ed **worker** process and main bus workhorse. The underlying
   * [BusWorker][] is run inside a [Worker][] context and handles all published
   * and subscribed busses and the aggregation of their values depending on
   * their [BusHandle][], i.e., hierarchy.
   *
   * [BusHandle]: https://sgrud.github.io/client/types/bus.BusHandle
   * [BusWorker]: https://sgrud.github.io/client/classes/bus.BusWorker
   * [Spawn]: https://sgrud.github.io/client/functions/core.Spawn
   * [Worker]: https://developer.mozilla.org/docs/Web/API/Worker/Worker
   *
   * @decorator [Spawn][]
   */
  @Spawn(name)
  public readonly worker!: Thread<BusWorker>;

  /**
   * Public **constructor**. As this class is a transparent [Singleton][],
   * calling the `new` operator on it will always yield the same instance. The
   * `new` operator can therefore be used to bulk-publish busses.
   *
   * [Singleton]: https://sgrud.github.io/client/functions/core.Singleton
   *
   * @param tuples - List of busses to publish.
   *
   * @example
   * Set the `'io.github.sgrud.example'` bus:
   * ```ts
   * import { BusHandler } from '@sgrud/bus';
   * import { of } from 'rxjs';
   *
   * new BusHandler([
   *   ['io.github.sgrud.example', of('published')]
   * ]);
   * ```
   */
  public constructor(tuples?: [BusHandle, Observable<any>][]) {
    if (tuples) {
      for (const [key, value] of tuples) {
        this.set(key, value);
      }
    }
  }

  /**
   * Invoking this method **get**s the [Observable][] bus represented by the
   * supplied `handle`. The method will return an [Observable][] originating
   * from the [BusWorker][] which emits all [BusValue][]s published under the
   * supplied `handle`. When **get**ting `'io.github.sgrud'`, all busses
   * hierarchically beneath this `handle`, e.g., `'io.github.bus.status'`, will
   * also be emitted by the returned [Observable][].
   *
   * [BusHandle]: https://sgrud.github.io/client/types/bus.BusHandle
   * [BusValue]: https://sgrud.github.io/client/interfaces/bus.BusValue
   * [BusWorker]: https://sgrud.github.io/client/classes/bus.BusWorker
   * [Observable]: https://rxjs.dev/api/index/class/Observable
   *
   * @param handle - [BusHandle][] to **get**.
   * @typeParam T - Bus type.
   * @returns [Observable][] bus for `handle`.
   *
   * @example
   * **Get** the `'io.github.sgrud'` bus:
   * ```ts
   * import { BusHandler } from '@sgrud/bus';
   *
   * const busHandler = new BusHandler();
   * busHandler.get('io.github.sgrud.example').subscribe(console.log);
   * ```
   */
  public get<T>(handle: BusHandle): Observable<BusValue<T>> {
    return from(this.worker).pipe(
      switchMap((worker) => worker.get(handle)),
      switchMap((value) => value)
    );
  }

  /**
   * Publishes the supplied [Observable][] `bus` under the supplied `handle`.
   * Calling this method registers the supplied [Observable][] with the
   * [BusWorker][]. When the [Observable][] completes, the registration will
   * self-destruct. When overwriting a registration by supplying a previously
   * used `handle` in conjunction with a different [Observable][] `bus`, the
   * previously supplied [Observable][] will be unsubscribed.
   *
   * [BusHandle]: https://sgrud.github.io/client/types/bus.BusHandle
   * [BusWorker]: https://sgrud.github.io/client/classes/bus.BusWorker
   * [Observable]: https://rxjs.dev/api/index/class/Observable
   *
   * @param handle - [BusHandle][] to **set**.
   * @param bus - [Observable][] bus for `handle`.
   * @typeParam T - Bus type.
   *
   * @example
   * **Set** the `'io.github.sgrud.example'` bus:
   * ```ts
   * import { BusHandler } from '@sgrud/bus';
   * import { of } from 'rxjs';
   *
   * const busHandler = new BusHandler();
   * busHandler.set('io.github.sgrud.example', of('published'));
   * ```
   */
  public set<T>(handle: BusHandle, bus: Observable<T>): void {
    from(this.worker).pipe(
      switchMap((worker) => worker.set(handle, bus))
    ).subscribe();
  }

}

export type { BusWorker };
