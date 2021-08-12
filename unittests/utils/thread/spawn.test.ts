import { Spawn, Thread } from '@sgrud/utils';
import { from, Observable, switchMap } from 'rxjs';
import { Worker } from 'worker_threads';

describe('@sgrud/utils/thread/spawn', () => {

  class Class {
    @Spawn(Worker.bind(Worker, '(' + (() => {
      /* eslint-disable */
      require('./dist/utils/index.js').Thread()(class {
        // @ts-expect-error
        callable = (...args) => args.length;
        thirteen = 13;
      });
      /* eslint-enable */
    }) + ')()', { eval: true }) as any)
    public static readonly worker: Thread<{
      callable: (...args: any) => number;
      interval: Observable<number>;
      thirteen: number;
    }>;
  }

  describe('applying the `@Spawn()` decorator', () => {
    it('spawns the target worker', () => {
      from(Class.worker).subscribe((worker) => {
        expect(worker).toBeInstanceOf(Function);
      });
    });
  });

  describe('getting a primitive', () => {
    it('returns the promised value', (done) => {
      from(Class.worker).pipe(
        switchMap((worker) => Promise.resolve(worker.thirteen))
      ).subscribe((thirteen) => {
        expect(thirteen).toBe(13);
        done();
      });
    });
  });

  describe('calling a worker function', () => {
    it('returns the promised return value', (done) => {
      from(Class.worker).pipe(
        switchMap((worker) => Promise.resolve(worker.callable([], 1, '2')))
      ).subscribe((length) => {
        expect(length).toBe(3);
        done();
      });
    });
  });

});
