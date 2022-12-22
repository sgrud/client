/* eslint-disable @typescript-eslint/no-var-requires */

/**
 * This test will fail if used with TypeScript imports instead of `require`
 * calls, as it needs identical imports in the test case and worker thread.
 */
describe('@sgrud/state/handler/transfer', () => {

  const { Spawn } = require('@sgrud/core');
  const { Store } = require('@sgrud/state');
  const { from, switchMap } = require('rxjs');
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
        store = class extends require('@sgrud/state').Store {
          param = 'default';
          // @ts-expect-error implicit any
          action(param) {
            return Object.assign({ }, this, { param });
          }
        }
        // @ts-expect-error implicit any
        action(store) {
          return Object.prototype.toString.call(store.prototype.action);
        }
        /* eslint-enable */
      });
    }) + ')()', { eval: true }))
    public static readonly worker: import('@sgrud/core').Thread<unknown>;
  }

  describe('transferring a class extending the store', () => {
    it('correctly de/serializes the transferred store', (done) => {
      from(Class.worker).pipe(
        switchMap((worker: any) => Promise.resolve(worker.store))
      ).subscribe({
        next: (value: any) => {
          expect(value.prototype).toBeInstanceOf(Store);
          expect(value.prototype.constructor).toThrowError(TypeError);
          expect(value.prototype.dispatch).toThrowError(ReferenceError);
          expect(value.prototype.action).toBeInstanceOf(Function);
          done();
        }
      });
    });
  });

  describe('retransferring a class extending the store', () => {
    it('correctly de/serializes the retransferred store', (done) => {
      from(Class.worker).pipe(
        switchMap((worker: any) => from(Promise.resolve(worker.store)).pipe(
          switchMap((store: any) => Promise.resolve(worker.action(store)))
        ))
      ).subscribe({
        next: (value: any) => {
          expect(value).toContain('[object Function]');
          done();
        }
      });
    });
  });

  describe('applying a transferred action function', () => {
    const state = { param: 'default' };

    it('returns the next expected state', (done) => {
      from(Class.worker).pipe(
        switchMap((worker: any) => Promise.resolve(worker.store))
      ).subscribe({
        next: (value: any) => {
          const next = value.prototype.action.call(state, 'next');

          expect(next).not.toBe(state);
          expect(next.param).toBe('next');
          done();
        }
      });
    });
  });

});
