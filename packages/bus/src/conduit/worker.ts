import { Thread } from '@sgrud/core';
import { BehaviorSubject, finalize, map, merge, Observable, shareReplay, switchMap } from 'rxjs';
import { ConduitHandle, ConduitValue } from './handler';

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
export class ConduitWorker {

  /**
   * Internal mapping containing all established **busses**. Updating this
   * mapping should always be accompanied by an emittance of *changes*.
   */
  private readonly changes: BehaviorSubject<this>;

  /**
   * [BehaviorSubject][] emitting every time a bus is added or deleted from the
   * internal *busses* mapping, i.e., when **changes** occur on the *busses*
   * mapping. This emittance is used to recompile the open [Subscription][]s
   * previously obtained to through use of the *get* method.
   *
   * [BehaviorSubject]: https://rxjs.dev/api/index/class/BehaviorSubject
   * [Subscription]: https://rxjs.dev/api/index/class/Subscription
   */
  private readonly conduits: Map<ConduitHandle, Observable<ConduitValue<any>>>;

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
    this.changes = new BehaviorSubject<this>(this);
    this.conduits = new Map<ConduitHandle, Observable<ConduitValue<any>>>();
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
  public get(handle: ConduitHandle): Observable<ConduitValue<any>> {
    return this.changes.pipe(switchMap(() => {
      const conduits = [];

      for (const [key, value] of this.conduits) {
        if (key.startsWith(handle)) {
          conduits.push(value);
        }
      }

      return merge(...conduits);
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
  public set(handle: ConduitHandle, conduit: Observable<any>): void {
    this.conduits.set(handle, conduit.pipe(
      map((value) => ({
        handle,
        value
      })),
      finalize(() => {
        this.conduits.delete(handle);
        this.changes.next(this);
      }),
      shareReplay(1)
    ));

    this.changes.next(this);
  }

}
