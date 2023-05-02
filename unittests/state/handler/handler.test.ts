/* eslint-disable @typescript-eslint/unbound-method */

import { Mutable, Symbol } from '@sgrud/core';
import { Effect, StateHandler, Store } from '@sgrud/state';
import express from 'express';
import { Server } from 'http';
import { from, map, of } from 'rxjs';

describe('@sgrud/state/handler/handler', () => {

  /*
   * Fixtures
   */

  let server: Server;
  afterAll(() => server.close());
  beforeAll(() => server = express()
    .use('/node_modules/@sgrud/state/worker', (_, r) => r.send(module))
    .listen(location.port));

  (navigator as Mutable<Navigator>).serviceWorker = {
    register: jest.fn(),
    controller: {
      postMessage: jest.fn()
    }
  } as unknown as ServiceWorkerContainer;

  /*
   * Variables
   */

  class EffectClass extends Effect {

    public function(): Store.Effects['test'] {
      return Function.prototype as (...args: any[]) => any;
    }

  }

  class StoreClass extends Store<StoreClass> {

    public readonly param?: string;

    public setParam(param: string): Store.State<this> {
      return Object.assign({}, this, { param });
    }

  }

  const module = {
    name: '@sgrud/state/worker',
    exports: './worker.esmod.js',
    unpkg: './worker.unpkg.js',

    connect: jest.fn(() => Promise.resolve()),
    deploy: jest.fn(() => Promise.resolve()),
    implant: jest.fn(() => Promise.resolve())
  };

  /*
   * Unittests
   */

  describe('constructing an instance', () => {
    const handler = new StateHandler();

    it('returns the singleton instance', () => {
      expect(handler).toBe(new StateHandler());
    });

    it('constructs the corresponding worker', (done) => {
      from(handler.worker).pipe(map((next) => {
        expect(next).toBeInstanceOf(Function);
      })).subscribe({
        complete: done,
        error: done
      });
    });
  });

  describe('deploying a store', () => {
    const handler = new StateHandler();

    it('correctly deploys the store', (done) => {
      handler.deploy('sgrud.test.state.class', StoreClass, {
        param: undefined
      }).pipe(map((next) => {
        expect(next).toBeUndefined();
      })).subscribe({
        complete: done,
        error: done
      });
    });
  });

  describe('dispatching an action', () => {
    const handler = new StateHandler();

    it('correctly dispatches the action', (done) => {
      handler.dispatch<StoreClass>('sgrud.test.state.class', 'setParam', [
        'done'
      ]).pipe(map((next) => {
        expect(next.param).toBe('done');
      })).subscribe({
        complete: done,
        error: done
      });
    });
  });

  describe('deprecating a store', () => {
    const handler = new StateHandler();

    it('correctly deprecates the store', (done) => {
      handler.deprecate('sgrud.test.state.class').pipe(map((next) => {
        expect(next).toBeUndefined();
      })).subscribe({
        complete: done,
        error: done
      });
    });
  });

  describe('implanting an effect', () => {
    const handler = new StateHandler();

    it('correctly implants the effect', (done) => {
      handler.implant('test', EffectClass).pipe(map((next) => {
        expect(next).toBeUndefined();
      })).subscribe({
        complete: done,
        error: done
      });
    });
  });

  describe('invalidating an effect', () => {
    const handler = new StateHandler();

    it('correctly invalidates the effect', (done) => {
      handler.invalidate('test').pipe(map((next) => {
        expect(next).toBeUndefined();
      })).subscribe({
        complete: done,
        error: done
      });
    });
  });

  describe('constructing an instance in an node environment', () => {
    it('constructs a node worker through the factory', async() => {
      jest.resetModules();

      jest.mock('comlink', () => ({
        ...jest.requireActual('comlink'),
        transfer: jest.fn(),
        wrap: jest.fn(() => module)
      }));

      jest.mock('@sgrud/bus', () => ({
        ...jest.requireActual('@sgrud/bus'),
        BusHandler: class {

          public static [Symbol.observable]() {
            return of(new this());
          }

          public get worker() {
            return {
              [require('comlink').createEndpoint]: Function.prototype
            };
          }

        }
      }));

      const { StateHandler: Handler } = require('@sgrud/state');
      await expect(new Handler().worker).resolves.toBe(module);
    });
  });

  describe('constructing an instance in an esm environment', () => {
    it('constructs an esm worker through the factory', async() => {
      globalThis.process = undefined!;
      jest.resetModules();

      const { StateHandler: Handler } = require('@sgrud/state');
      await expect(new Handler().worker).resolves.toBe(module);

      expect(navigator.serviceWorker.register).toBeCalledWith(
        `/node_modules/${module.name}/${module.exports}`, {
          scope: `/node_modules/${module.name}`,
          type: 'module'
        }
      );
    });
  });

  describe('constructing an instance in an umd environment', () => {
    it('constructs an umd worker through the factory', async() => {
      globalThis.sgrud = undefined! || true;
      jest.resetModules();

      const { StateHandler: Handler } = require('@sgrud/state');
      await expect(new Handler().worker).resolves.toBe(module);

      expect(navigator.serviceWorker.register).toBeCalledWith(
        `/node_modules/${module.name}/${module.unpkg}`, {
          scope: `/node_modules/${module.name}`,
          type: 'classic'
        }
      );
    });
  });

  describe('constructing an instance in an incompatible environment', () => {
    it('throws an error on worker construction', async() => {
      module.exports = undefined!;
      module.unpkg = undefined!;
      jest.resetModules();

      const { StateHandler: Handler } = require('@sgrud/state');
      await expect(new Handler().worker).rejects.toThrow();
    });
  });

});
