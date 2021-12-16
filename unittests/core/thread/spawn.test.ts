import { Spawn, Thread } from '@sgrud/core';
import { from, switchMap } from 'rxjs';
import { Worker } from 'worker_threads';

describe('@sgrud/core/thread/spawn', () => {

  class Class {
    @Spawn(Worker.bind<any, any>(Worker, '(' + (() => {
      /* eslint-disable */
      require('./dist/core/index.js').Thread()(class {
        // @ts-expect-error missing annotation
        callable = (...args) => args.length;
        thirteen = 13;
      });
      /* eslint-enable */
    }) + ')()', { eval: true }))
    public static readonly worker: Thread<{
      callable: (...args: any[]) => number;
      thirteen: number;
    }>;
  }

  describe('applying the decorator', () => {
    it('spawns the worker through the factory', () => {
      from(Class.worker).subscribe((worker) => {
        expect(worker).toBeInstanceOf(Function);
      });
    });
  });

  describe('getting a primitive', () => {
    it('returns the promisified value', (done) => {
      from(Class.worker).pipe(
        switchMap((worker) => Promise.resolve(worker.thirteen))
      ).subscribe((thirteen) => {
        expect(thirteen).toBe(13);
        done();
      });
    });
  });

  describe('calling a function', () => {
    it('returns the promisified return value', (done) => {
      from(Class.worker).pipe(
        switchMap((worker) => Promise.resolve(worker.callable([], 1, '2')))
      ).subscribe((length) => {
        expect(length).toBe(3);
        done();
      });
    });
  });

});
