import { Singleton, Spawn, Thread, typeOf } from '@sgrud/utils';
import { from, Observable, switchMap } from 'rxjs';
import ConduitWorkerThread from 'worker:./worker';
import { ConduitWorker } from './worker';

export type ConduitHandle =
  [string, string, string, ...string[]] |
  `${string}.${string}.${string}`;

@Singleton<typeof ConduitHandler>()
export class ConduitHandler {

  @Spawn(ConduitWorkerThread)
  private static readonly worker: Thread<ConduitWorker>;

  public get(handle: ConduitHandle): Observable<any> {
    return from(ConduitHandler.worker).pipe(
      switchMap((worker) => Promise.resolve(worker)),
      switchMap((worker) => worker.get(this.handle(handle))),
      switchMap((value) => value)
    );
  }

  public set(handle: ConduitHandle, value: Observable<any>): void {
    from(ConduitHandler.worker).pipe(
      switchMap((worker) => Promise.resolve(worker)),
      switchMap((worker) => worker.set(this.handle(handle), value))
    ).subscribe();
  }

  private handle(handle: ConduitHandle): string {
    return typeOf.array(handle) ? handle.join('.') : handle;
  }

}
