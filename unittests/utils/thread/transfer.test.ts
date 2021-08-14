/* eslint-disable @typescript-eslint/no-var-requires */

describe('@sgrud/utils/thread/transfer', () => {

  /**
   * This test will fail if used with TypeScript imports instead of `require`
   * calls, as it needs identical imports in the test case ans worker thread.
   */
  const { Spawn } = require('@sgrud/utils');
  const { from, Observable, switchMap, take } = require('rxjs');
  const { Worker } = require('worker_threads');

  class Class {
    @Spawn(Worker.bind(Worker, '(' + (() => {
      require('./dist/utils/index.js').Thread()(class {
        /* eslint-disable */
        observable = require('rxjs').of(1, 2, 3);
        subject = new (require('rxjs').BehaviorSubject)(0);
        /* eslint-enable */
      });
    }) + ')()', { eval: true }))
    public static readonly worker: import('@sgrud/utils').Thread<{
      observable: import('rxjs').Observable<number>;
    }>;
  }

  describe('getting an observable', () => {
    it('returns the promised observable from the worker', (done) => {
      from(Class.worker).pipe(
        switchMap((worker: any) => Promise.resolve(worker.observable))
      ).subscribe((observable: any) => {
        expect(observable).toBeInstanceOf(Observable);
        done();
      });
    });
  });

  describe('subscribing to an observable', () => {
    it('observes values emitted by the observable in the worker', (done) => {
      const callback = jest.fn((number) => {
        expect(callback).toHaveBeenCalledTimes(number);
      });

      from(Class.worker).pipe(
        switchMap((worker: any) => Promise.resolve(worker.observable)),
        switchMap((observable: any) => observable)
      ).subscribe({
        next: callback,
        error: console.error,
        complete: () => {
          expect(callback).toHaveBeenCalled();
          done();
        }
      });
    });
  });

  describe('subscribing to a subject', () => {
    it('observes values emitted by the subject in the worker', (done) => {
      from(Class.worker).pipe(
        switchMap((worker: any) => Promise.resolve(worker.subject)),
        switchMap((subject: any) => subject),
        take(1)
      ).subscribe({
        next: (next: number) => expect(next).toBe(0),
        error: console.error,
        complete: () => done()
      });
    });
  });

});
