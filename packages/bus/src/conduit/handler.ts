import { Singleton, Spawn, Thread } from '@sgrud/utils';
import { from, Observable, switchMap } from 'rxjs';
import ConduitWorkerThread from 'worker:./worker';
import { ConduitWorker } from './worker';

export type ConduitHandle = `${string}.${string}.${string}`;

export type ConduitValue<T> = {
  handle: ConduitHandle;
  value: T;
};

@Singleton<typeof ConduitHandler>()
export class ConduitHandler {

  @Spawn(ConduitWorkerThread)
  private static readonly worker: Thread<ConduitWorker>;

  public get<T>(handle: ConduitHandle): Observable<ConduitValue<T>> {
    return from(ConduitHandler.worker).pipe(
      switchMap((worker) => worker.get(handle)),
      switchMap((value) => value)
    );
  }

  public set<T>(handle: ConduitHandle, value: Observable<T>): void {
    from(ConduitHandler.worker).pipe(
      switchMap((worker) => worker.set(handle, value))
    ).subscribe();
  }

}
