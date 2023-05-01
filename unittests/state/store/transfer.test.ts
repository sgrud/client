/*
 * This test will fail if used with TypeScript imports instead of `require`
 * calls, as it needs identical imports in the test case and worker thread.
 */
describe('@sgrud/state/store/transfer', () => {

  /*
   * Variables
   */

  const { Spawn } = require('@sgrud/core');
  const { Store } = require('@sgrud/state');
  const { from, switchMap, tap } = require('rxjs');
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

      require('@sgrud/core').Thread()(class {
        /* eslint-disable @typescript-eslint/explicit-member-accessibility */
        /* eslint-disable @typescript-eslint/typedef */
        store = class extends require('@sgrud/state').Store {
          param = 'default';
          // @ts-expect-error implicit any
          action(param) {
            return Object.assign({}, this, { param });
          }
        };
        // @ts-expect-error implicit any
        method = (param) => param;
        /* eslint-enable @typescript-eslint/explicit-member-accessibility */
        /* eslint-enable @typescript-eslint/typedef */
      });
    }) + ')()', { eval: true }))
    public readonly worker!: import('@sgrud/core').Thread<unknown>;

  }

  /*
   * Unittests
   */

  describe('transferring a class extending the store', () => {
    const store = from(Handler.prototype.worker).pipe(
      switchMap((worker: any) => Promise.resolve(worker.store))
    );

    it('correctly de/serializes the transferred store', (done) => {
      store.pipe(tap((next: any) => {
        expect(next.prototype).toBeInstanceOf(Store);
        expect(next.prototype.constructor).toThrowError(TypeError);
        expect(next.prototype.dispatch).toThrowError(ReferenceError);
        expect(next.prototype.action).toBeInstanceOf(Function);
      })).subscribe({
        complete: done,
        error: done
      });
    });
  });

  describe('retransferring a class extending the store', () => {
    const store = from(Handler.prototype.worker).pipe(
      switchMap((worker: any) => from(Promise.resolve(worker.store)).pipe(
        switchMap((next: any) => Promise.resolve(worker.method(next)))
      ))
    );

    it('correctly de/serializes the retransferred store', (done) => {
      store.pipe(tap((next: any) => {
        expect(next.prototype).toBeInstanceOf(Store);
      })).subscribe({
        complete: done,
        error: done
      });
    });
  });

  describe('applying a transferred action function', () => {
    const state = { param: 'default' };
    const store = from(Handler.prototype.worker).pipe(
      switchMap((worker: any) => Promise.resolve(worker.store)),
      switchMap((next: any) => next.prototype.action.call(state, 'next'))
    );

    it('returns the next expected state', (done) => {
      store.pipe(tap((next: any) => {
        expect(next).not.toBe(state);
        expect(next.param).toBe('next');
      })).subscribe({
        complete: done,
        error: done
      });
    });
  });

});
