import { Thread } from '@sgrud/utils';
import { BehaviorSubject, finalize, merge, Observable, shareReplay, switchMap } from 'rxjs';

@Thread()
export class ConduitWorker {

  private readonly changes: BehaviorSubject<this>;

  private readonly conduits: Map<string, Observable<any>>;

  public constructor() {
    this.changes = new BehaviorSubject<this>(this);
    this.conduits = new Map<string, Observable<any>>();
  }

  public get(handle: string): Observable<any> {
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

  public set(handle: string, value: Observable<any>): void {
    this.conduits.set(handle, value.pipe(
      finalize(() => {
        this.conduits.delete(handle);
        this.changes.next(this);
      }),
      shareReplay()
    ));

    this.changes.next(this);
  }

}
