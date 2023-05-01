/*
 * This test will fail if used with TypeScript imports instead of `require`
 * calls, as it needs identical imports in the test case and worker thread.
 */
describe('@sgrud/bus/bus/transfer', () => {

  /*
   * Variables
   */

  require('@sgrud/bus');
  const { Spawn } = require('@sgrud/core');
  const { catchError, from, Observable, of, switchMap, tap } = require('rxjs');
  const { Worker } = require('worker_threads');

  class Handler {

    @Spawn(new Worker('(' + (() => {
      const Module = require('module');
      const { _resolveFilename } = Module;

      // @ts-expect-error implicit any
      Module._resolveFilename = (id, parent) => {
        if (id.startsWith('@sgrud/')) {
          return require.resolve(id.replace('@sgrud', './dist'));
        }

        return _resolveFilename(id, parent);
      };

      require('@sgrud/bus');
      require('@sgrud/core').Thread()(class {
        /* eslint-disable @typescript-eslint/explicit-member-accessibility */
        /* eslint-disable @typescript-eslint/typedef */
        observable = require('rxjs').of({ observable: true });
        exception = require('rxjs').throwError(() => ({ exception: true }));
        /* eslint-enable @typescript-eslint/explicit-member-accessibility */
        /* eslint-enable @typescript-eslint/typedef */
      });
    }) + ')()', { eval: true }))
    public readonly worker!: import('@sgrud/core').Thread<unknown>;

  }

  /*
   * Unittests
   */

  describe('getting an observable', () => {
    const observable = from(Handler.prototype.worker).pipe(
      switchMap((worker: any) => Promise.resolve(worker.observable))
    );

    it('returns the promisified observable', (done) => {
      observable.pipe(tap((next: any) => {
        expect(next).toBeInstanceOf(Observable);
      })).subscribe({
        complete: done,
        error: done
      });
    });
  });

  describe('subscribing to an observable', () => {
    const observable = from(Handler.prototype.worker).pipe(
      switchMap((worker: any) => Promise.resolve(worker.observable)),
      switchMap((next: any) => next)
    );

    it('observes values emitted by the observable', (done) => {
      observable.pipe(tap((next: any) => {
        expect(next).toMatchObject({ observable: true });
      })).subscribe({
        complete: done,
        error: done
      });
    });
  });

  describe('subscribing to an error', () => {
    const exception = from(Handler.prototype.worker).pipe(
      switchMap((worker: any) => Promise.resolve(worker.exception)),
      switchMap((next: any) => next),
      catchError((error: any) => of(error))
    );

    it('throws the emitted error', (done) => {
      exception.pipe(tap((next: any) => {
        expect(next).toMatchObject({ exception: true });
      })).subscribe({
        complete: done,
        error: done
      });
    });
  });

});
