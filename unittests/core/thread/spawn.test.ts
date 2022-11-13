import { Spawn, Thread } from '@sgrud/core';
import { createEndpoint, wrap } from 'comlink';
import { from, map, switchMap } from 'rxjs';
import { Worker } from 'worker_threads';

describe('@sgrud/core/thread/spawn', () => {

  class Class {
    @Spawn(new Worker('(' + (() => {
      /* eslint-disable */
      require('./dist/core').Thread()(class {
        // @ts-expect-error implicit any
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
    it('spawns the worker through the factory', (done) => {
      from(Class.worker).subscribe((worker) => {
        expect(worker).toBeInstanceOf(Function);
        done();
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

  describe('getting a primitive from a new endpoint', () => {
    it('returns the promisified value from the new endpoint', (done) => {
      from(Class.worker).pipe(
        switchMap((worker) => worker[createEndpoint]()),
        map((messagePort) => wrap<any>(messagePort)),
        switchMap((worker) => Promise.resolve(worker.thirteen))
      ).subscribe((thirteen) => {
        expect(thirteen).toBe(13);
        done();
      });
    });
  });

  describe('calling a function on a new endpoint', () => {
    it('returns the promisified return value from the new endpoint', (done) => {
      from(Class.worker).pipe(
        switchMap((worker) => worker[createEndpoint]()),
        map((messagePort) => wrap<any>(messagePort)),
        switchMap((worker) => Promise.resolve(worker.callable([], 1, '2')))
      ).subscribe((length) => {
        expect(length).toBe(3);
        done();
      });
    });
  });

});
