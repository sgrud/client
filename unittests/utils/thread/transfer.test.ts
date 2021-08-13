/* eslint-disable @typescript-eslint/no-var-requires */

describe('@sgrud/utils/thread/transfer', () => {

  const { Spawn } = require('@sgrud/utils');
  const { from, Observable, switchMap } = require('rxjs');
  const { Worker } = require('worker_threads');

  class Class {
    @Spawn(Worker.bind(Worker, '(' + (() => {
      /* eslint-disable */
      require('./dist/utils/index.js').Thread()(class {
        observable = require('rxjs').of(1, 2, 3);
      });
      /* eslint-enable */
    }) + ')()', { eval: true }))
    public static readonly worker: import('@sgrud/utils').Thread<{
      observable: import('rxjs').Observable<number>;
    }>;
  }

  describe('getting an observable', () => {
    it('returns the promised observable', (done) => {
      from(Class.worker).pipe(
        switchMap((worker: any) => Promise.resolve(worker.observable))
      ).subscribe((observable: import('rxjs').Observable<number>) => {
        expect(observable).toBeInstanceOf(Observable);
        done();
      });
    });
  });

  describe('subscribing to an observable', () => {
    it('observes the contained values', (done) => {
      const callback = jest.fn((number) => {
        expect(callback).toHaveBeenCalledTimes(number);
      });

      from(Class.worker).pipe(
        switchMap((worker: any) => Promise.resolve(worker.observable)),
        switchMap((observable: import('rxjs').Observable<number>) => observable)
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

});
