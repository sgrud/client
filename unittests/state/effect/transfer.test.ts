/*
 * This test will fail if used with TypeScript imports instead of `require`
 * calls, as it needs identical imports in the test case and worker thread.
 */
describe('@sgrud/state/effect/transfer', () => {

  /*
   * Variables
   */

  const { Spawn } = require('@sgrud/core');
  const { Effect } = require('@sgrud/state');
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
        effect = class extends require('@sgrud/state').Effect {
          function() {
            return () => undefined;
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

  describe('transferring an effect', () => {
    const effect = from(Handler.prototype.worker).pipe(
      switchMap((worker: any) => Promise.resolve(worker.effect))
    );

    it('correctly de/serializes the transferred effect', (done) => {
      effect.pipe(tap((next: any) => {
        expect(next.prototype).toBeInstanceOf(Effect);
        expect(next.prototype.constructor).toThrowError(TypeError);
        expect(next.prototype.function).toBeInstanceOf(Function);
      })).subscribe({
        complete: done,
        error: done
      });
    });
  });

  describe('retransferring an effect', () => {
    const effect = from(Handler.prototype.worker).pipe(
      switchMap((worker: any) => from(Promise.resolve(worker.effect)).pipe(
        switchMap((next: any) => Promise.resolve(worker.method(next)))
      ))
    );

    it('correctly de/serializes the retransferred effect', (done) => {
      effect.pipe(tap((next: any) => {
        expect(next.prototype).toBeInstanceOf(Effect);
      })).subscribe({
        complete: done,
        error: done
      });
    });
  });

});
