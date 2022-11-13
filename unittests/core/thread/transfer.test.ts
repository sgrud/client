/* eslint-disable @typescript-eslint/no-var-requires */

/**
 * This test will fail if used with TypeScript imports instead of `require`
 * calls, as it needs identical imports in the test case and worker thread.
 */
describe('@sgrud/core/thread/transfer', () => {

  const { Spawn } = require('@sgrud/core');
  const { first, from, Observable, switchMap } = require('rxjs');
  const { Worker } = require('worker_threads');

  class Class {
    @Spawn(new Worker('(' + (() => {
      const Module = require('module');
      const { _resolveFilename } = Module;

      // @ts-expect-error implicit any
      // eslint-disable-next-line @typescript-eslint/typedef
      Module._resolveFilename = function(request, parent) {
        if (request.startsWith('@sgrud/')) {
          return require.resolve(request.replace('@sgrud', './dist'));
        }

        return _resolveFilename(request, parent);
      };

      require('@sgrud/core').Thread()(class {
        /* eslint-disable */
        observable = require('rxjs').of(1, 2, 3);
        subject = new (require('rxjs').BehaviorSubject)('behaviorSubject');
        error = require('rxjs').throwError(() => new Error());
        /* eslint-enable */
      });
    }) + ')()', { eval: true }))
    public static readonly worker: import('@sgrud/core').Thread<unknown>;
  }

  describe('getting an Observable', () => {
    it('returns the promisified Observable', (done) => {
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

  describe('subscribing to an Observable', () => {
    it('observes values emitted by the Observable', (done) => {
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

  describe('subscribing to a BehaviorSubject', () => {
    it('observes values emitted by the BehaviorSubject', (done) => {
      from(Class.worker).pipe(
        switchMap((worker: any) => Promise.resolve(worker.subject)),
        switchMap((behaviorSubject: any) => behaviorSubject),
        first()
      ).subscribe({
        next: (next: string) => {
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
