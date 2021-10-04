import { Thread } from '@sgrud/utils';
import { BehaviorSubject, finalize, map, merge, Observable, shareReplay, switchMap } from 'rxjs';
import { ConduitHandle, ConduitValue } from './handler';

/**
 * The `WebWorker` {@link Spawn}ed by the {@link ConduitHandler} handling all
 * published and subscribed conduits and the aggregation of their values
 * depending on their hierarchy.
 *
 * @decorator {@link Thread}
 *
 * @see {@link ConduitHandler}
 */
@Thread()
export class ConduitWorker {

  /**
   * BehaviorSubject emitting every time a conduit is added or deleted from the
   * internal {@link conduits} map. This emittance is used to recompile the open
   * subscriptions previously obtained to through use of the {@link get} method.
   */
  private readonly changes: BehaviorSubject<this>;

  /**
   * Internal map containing all established conduits. Updating this map should
   * always be accompanied by an emittance of the {@link changes}.
   */
  private readonly conduits: Map<string, Observable<ConduitValue<any>>>;

  /**
   * Public ConduitWorker constructor. This constructor is called once when
   * {@link Spawn}ing the `WebWorker` running this class.
   *
   * @see {@link ConduitHandler}
   */
  public constructor() {
    this.changes = new BehaviorSubject<this>(this);
    this.conduits = new Map<string, Observable<ConduitValue<any>>>();
  }

  /**
   * Gets the conduit for the supplied `handle`. This method is called by the
   * {@link ConduitHandler} and is only then proxied to the `WebWorker` running
   * this class.
   *
   * @param handle - Conduit handle.
   * @returns Observable.
   *
   * @see {@link ConduitHandler}
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
   * Sets the supplied `conduit` for the supplied `handle`. This method is
   * called by the {@link ConduitHandler} and is only then proxied to the
   * `WebWorker` running this class.
   *
   * @param handle - Conduit handle.
   * @param conduit - Observable.
   *
   * @see {@link ConduitHandler}
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
      shareReplay()
    ));

    this.changes.next(this);
  }

}
