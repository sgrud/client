import { BusHandle, BusValue } from '@sgrud/bus';
import { Singleton, Thread } from '@sgrud/core';
import { BehaviorSubject, finalize, map, merge, Observable, shareReplay, switchMap } from 'rxjs';

/**
 * The **BusWorker** is a [Worker][] process, [Spawn][]ed by the [BusHandler][]
 * to handle all published and subscribed to busses and the aggregation of their
 * values depending on their hierarchy.
 *
 * [BusHandler]: https://sgrud.github.io/client/classes/bus.BusHandler
 * [Singleton]: https://sgrud.github.io/client/functions/core.Singleton
 * [Spawn]: https://sgrud.github.io/client/functions/core.Spawn
 * [Thread]: https://sgrud.github.io/client/functions/core.Thread-1
 * [Worker]: https://developer.mozilla.org/docs/Web/API/Worker/Worker
 *
 * @decorator [Thread][]
 * @decorator [Singleton][]
 *
 * @see [BusHandler][]
 */
@Thread()
@Singleton<typeof BusWorker>()
export class BusWorker {

  /**
   * Internal mapping containing all established **busses**. Updating this
   * mapping should always be accompanied by an emittance of *changes*.
   */
  private readonly busses: Map<BusHandle, Observable<BusValue<any>>>;

  /**
   * [BehaviorSubject][] emitting every time a bus is added or deleted from the
   * internal *busses* mapping, i.e., when **changes** occur on the *busses*
   * mapping. This emittance is used to recompile the open [Subscription][]s
   * previously obtained to through use of the *get* method.
   *
   * [BehaviorSubject]: https://rxjs.dev/api/index/class/BehaviorSubject
   * [Subscription]: https://rxjs.dev/api/index/class/Subscription
   */
  private readonly changes: BehaviorSubject<this>;

  /**
   * Public **constructor**. This **constructor** is called once when the
   * [BusHandler][] [Spawn][]s the [Worker][] running this class.
   *
   * [BusHandler]: https://sgrud.github.io/client/classes/bus.BusHandler
   * [BusWorker]: https://sgrud.github.io/client/classes/bus.BusWorker
   * [Singleton]: https://sgrud.github.io/client/functions/core.Singleton
   * [Spawn]: https://sgrud.github.io/client/functions/core.Spawn
   * [Thread]: https://sgrud.github.io/client/functions/core.Thread-1
   * [Worker]: https://developer.mozilla.org/docs/Web/API/Worker/Worker
   */
  public constructor() {
    this.busses = new Map<BusHandle, Observable<BusValue<any>>>();
    this.changes = new BehaviorSubject<this>(this);
  }

  /**
   * Invoking this method **get**s the [Observable][] bus represented by the
   * supplied `handle`. This method is called by the [BusHandler][] and is only
   * then proxied to the [Worker][] running this class.
   *
   * [BusHandle]: https://sgrud.github.io/client/types/bus.BusHandle
   * [BusHandler]: https://sgrud.github.io/client/classes/bus.BusHandler
   * [Observable]: https://rxjs.dev/api/index/class/Observable
   * [Worker]: https://developer.mozilla.org/docs/Web/API/Worker/Worker
   *
   * @param handle - [BusHandle][] to **get**.
   * @returns [Observable][] bus for `handle`.

   */
  public get(handle: BusHandle): Observable<BusValue<any>> {
    return this.changes.pipe(switchMap(() => {
      const busses = [];

      for (const [key, value] of this.busses) {
        if (key.startsWith(handle)) {
          busses.push(value);
        }
      }

      return merge(...busses);
    }));
  }

  /**
   * Invoking this method **set**s the supplied [Observable][] `bus` for the
   * supplied `handle`. This method is called by the [BusHandler][] and is only
   * then proxied to the [Worker][] running this class.
   *
   * [BusHandle]: https://sgrud.github.io/client/types/bus.BusHandle
   * [BusHandler]: https://sgrud.github.io/client/classes/bus.BusHandler
   * [Observable]: https://rxjs.dev/api/index/class/Observable
   * [Worker]: https://developer.mozilla.org/docs/Web/API/Worker/Worker
   *
   * @param handle - [BusHandle][] to **set**.
   * @param bus - [Observable][] bus for `handle`.
   */
  public set(handle: BusHandle, bus: Observable<any>): void {
    this.busses.set(handle, bus.pipe(
      map((value) => ({
        handle,
        value
      })),
      finalize(() => {
        this.busses.delete(handle);
        this.changes.next(this);
      }),
      shareReplay()
    ));

    this.changes.next(this);
  }

}
