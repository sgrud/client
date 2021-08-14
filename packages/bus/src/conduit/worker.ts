import { Thread } from '@sgrud/utils';
import { BehaviorSubject, finalize, map, merge, Observable, shareReplay, switchMap } from 'rxjs';
import { ConduitHandle, ConduitValue } from './handler';

@Thread()
export class ConduitWorker {

  private readonly changes: BehaviorSubject<this>;

  private readonly conduits: Map<string, Observable<ConduitValue<any>>>;

  public constructor() {
    this.changes = new BehaviorSubject<this>(this);
    this.conduits = new Map<string, Observable<ConduitValue<any>>>();
  }

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
