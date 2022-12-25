import { Thread } from '@sgrud/core';
import * as comlink from 'comlink';

describe('@sgrud/core/thread/thread', () => {

  const spy = jest.spyOn(comlink, 'expose');

  describe('applying the decorator', () => {
    const apply = () => {
      Thread()(class { });
    };

    it('throws an error in the main thread', () => {
      expect(apply).toThrowError(ReferenceError);
    });
  });

  describe('applying the decorator in a browser environment', () => {
    const apply = () => {
      Thread()(class { });
    };

    it('correctly decorates the threading class', () => {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      require('worker_threads').isMainThread = false;
      jest.mock('comlink/dist/umd/node-adapter');

      expect(apply).not.toThrow();
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('applying the decorator in a node environment', () => {
    const apply = () => {
      Thread()(class { });
    };

    it('correctly decorates the threading class', () => {
      globalThis.importScripts = Function.prototype as any;

      expect(apply).not.toThrow();
      expect(spy).toHaveBeenCalled();
    });
  });

});
