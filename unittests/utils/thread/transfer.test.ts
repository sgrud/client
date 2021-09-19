/* eslint-disable @typescript-eslint/no-var-requires */

/**
 * This test will fail if used with TypeScript imports instead of `require`
 * calls, as it needs identical imports in the test case and worker thread.
 */
describe('@sgrud/utils/thread/transfer', () => {

  const { Spawn } = require('@sgrud/utils');
  const { from, Observable, switchMap, take } = require('rxjs');
  const { Worker } = require('worker_threads');

  class Class {
    @Spawn(Worker.bind(Worker, '(' + (() => {
      require('./dist/utils/index.js').Thread()(class {
        /* eslint-disable */
        observable = require('rxjs').of(1, 2, 3);
        subject = new (require('rxjs').BehaviorSubject)('behaviorSubject');
        error = require('rxjs').throwError(() => new Error('message'));
        /* eslint-enable */
      });
    }) + ')()', { eval: true }))
    public static readonly worker: import('@sgrud/utils').Thread<{
      observable: import('rxjs').Observable<number>;
    }>;
  }

  describe('getting an observable', () => {
    it('returns the promisified observable', (done) => {
      from(Class.worker).pipe(
        switchMap((worker: any) => Promise.resolve(worker.observable))
      ).subscribe({
        next: (observable: any) => {
          expect(observable).toBeInstanceOf(Observable);
          done();
        }
      });
    });
  });

  describe('subscribing to an observable', () => {
    it('observes values emitted by the observable', (done) => {
      const test = jest.fn((number) => {
        expect(test).toHaveBeenCalledTimes(number);
      });

      from(Class.worker).pipe(
        switchMap((worker: any) => Promise.resolve(worker.observable)),
        switchMap((observable: any) => observable)
      ).subscribe({
        next: test,
        complete: () => {
          expect(test).toHaveBeenCalled();
          done();
        }
      });
    });
  });

  describe('subscribing to a behavior subject', () => {
    it('observes values emitted by the behavior subject', (done) => {
      from(Class.worker).pipe(
        switchMap((worker: any) => Promise.resolve(worker.subject)),
        switchMap((behaviorSubject: any) => behaviorSubject),
        take(1)
      ).subscribe({
        next: (next: number) => {
          expect(next).toBe('behaviorSubject');
          done();
        }
      });
    });
  });

  describe('subscribing to an error', () => {
    it('throws the emitted error', (done) => {
      from(Class.worker).pipe(
        switchMap((worker: any) => Promise.resolve(worker.error)),
        switchMap((error: any) => error)
      ).subscribe({
        error: (error: any) => {
          expect(error).toMatchObject({ });
          done();
        }
      });
    });
  });

});
