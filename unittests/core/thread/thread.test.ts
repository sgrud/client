import { Thread } from '@sgrud/core';
import * as comlink from 'comlink';

describe('@sgrud/core/thread/thread', () => {

  /*
   * Fixtures
   */

  jest.mock('comlink/dist/umd/node-adapter');

  afterEach(() => expose.mockClear());
  const expose = jest.spyOn(comlink, 'expose');

  /*
   * Unittests
   */

  describe('applying the decorator in the main thread', () => {
    const decorate = () => Thread()(class {});

    it('throws an error', () => {
      expect(decorate).toThrowError(TypeError);
      expect(expose).not.toBeCalled();
    });
  });

  describe('applying the decorator in a browser environment', () => {
    const decorate = () => Thread()(class {});

    it('correctly decorates the threading class', () => {
      require('worker_threads').isMainThread = false;

      expect(decorate).not.toThrow();
      expect(expose).toBeCalled();
    });
  });

  describe('applying the decorator in a node environment', () => {
    const decorate = () => Thread()(class {});

    it('correctly decorates the threading class', () => {
      globalThis.importScripts = () => undefined;

      expect(decorate).not.toThrow();
      expect(expose).toBeCalled();
    });
  });

  describe('applying the decorator in an incompatible environment', () => {
    const decorate = () => Thread()(class {});

    it('throws an error', () => {
      globalThis.importScripts = undefined!;
      globalThis.process = undefined!;

      expect(decorate).toThrow();
      expect(expose).not.toBeCalled();
    });
  });

});
