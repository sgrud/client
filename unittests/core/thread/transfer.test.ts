/*
 * This test will fail if used with TypeScript imports instead of `require`
 * calls, as it needs identical imports in the test case and worker thread.
 */
describe('@sgrud/core/thread/transfer', () => {

  /*
   * Variables
   */

  const { Spawn } = require('@sgrud/core');
  const { proxy } = require('comlink');
  const { from, switchMap, map } = require('rxjs');
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
        property = require('comlink').proxy([{}]);
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

  describe('getting a value', () => {
    const transfer = from(Handler.prototype.worker).pipe(
      switchMap((worker: any) => Promise.resolve(worker.property)),
      switchMap((next: any) => Promise.resolve(next[0]))
    );

    it('returns the promisified value', (done) => {
      transfer.pipe(map((next: any) => {
        expect(next).toMatchObject({});
      })).subscribe({
        complete: done,
        error: done
      });
    });
  });

  describe('calling a method', () => {
    const transfer = from(Handler.prototype.worker).pipe(
      switchMap((worker: any) => Promise.resolve(worker.method(proxy([{}])))),
      switchMap((next: any) => Promise.resolve(next[0]))
    );

    it('returns the promisified return value', (done) => {
      transfer.pipe(map((next: any) => {
        expect(next).toMatchObject({});
      })).subscribe({
        complete: done,
        error: done
      });
    });
  });

});
