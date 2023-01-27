import { Thread } from '@sgrud/core';
import * as comlink from 'comlink';

describe('@sgrud/core/thread/thread', () => {

  describe('applying the decorator', () => {
    const decorate = () => Thread()(class { });

    it('throws an error in the main thread', () => {
      expect(decorate).toThrowError(ReferenceError);
    });
  });

  describe('applying the decorator in a browser environment', () => {
    const decorate = () => Thread()(class { });
    const expose = jest.spyOn(comlink, 'expose');

    it('correctly decorates the threading class', () => {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      require('worker_threads').isMainThread = false;
      jest.mock('comlink/dist/umd/node-adapter');

      expect(decorate).not.toThrow();
      expect(expose).toHaveBeenCalled();
    });
  });

  describe('applying the decorator in a node environment', () => {
    const decorate = () => Thread()(class { });
    const expose = jest.spyOn(comlink, 'expose');

    it('correctly decorates the threading class', () => {
      globalThis.importScripts = Function.prototype as any;

      expect(decorate).not.toThrow();
      expect(expose).toHaveBeenCalled();
    });
  });

});
