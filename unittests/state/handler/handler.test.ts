/* eslint-disable @typescript-eslint/no-var-requires */

import { BusHandler } from '@sgrud/bus';
import { Mutable } from '@sgrud/core';
import { Effect, StateHandler, Store } from '@sgrud/state';
import { expose } from 'comlink';
import nodeEndpoint from 'comlink/dist/umd/node-adapter';
import express from 'express';
import { Server } from 'http';
import { from, Subject, switchMap } from 'rxjs';
import { MessageChannel } from 'worker_threads';

declare global {
  namespace sgrud.state.effects {
    function test(): void;
  }
}

globalThis.MessageChannel = new Proxy<any>(MessageChannel, {
  construct: (...args) => {
    const messageChannel = Reflect.construct(...args);
    messageChannel.port1 = nodeEndpoint(messageChannel.port1);
    messageChannel.port2 = nodeEndpoint(messageChannel.port2);
    return messageChannel;
  }
});

describe('@sgrud/state/handler/handler', () => {

  let server: Server;
  afterAll(() => server.close());
  beforeAll(() => server = express()
    .use('/api/sgrud/v1/insmod', (_, r) => r.send({ }))
    .use('/node_modules/@sgrud/state/worker', (_, r) => r.send(module))
    .listen(location.port));

  const container = {
    register: jest.fn(),
    controller: {
      postMessage: jest.fn((message) => {
        expose(module, message[module.name]);
      })
    }
  };

  (navigator as Mutable<Navigator>).serviceWorker = (
    container as unknown as ServiceWorkerContainer
  );

  const module = {
    name: '@sgrud/state/worker',
    exports: './worker.esmod.js' as string | undefined,
    unpkg: './worker.unpkg.js' as string | undefined,

    connect: jest.fn(),
    deploy: jest.fn(),
    dispatch: jest.fn(),
    implant: jest.fn()
  };

  class EffectClass extends Effect {
    public function(): Store.Effects['test'] {
      return Function.prototype as () => void;
    }
  }

  class StoreClass extends Store<StoreClass> {
    public readonly param?: string;
    public setParam(param: string): Store.State<this> {
      return { ...this, param };
    }
  }

  describe('instantiating a handler', () => {
    const handler = new StateHandler();

    const registered = [
      [
        location.origin,
        'node_modules',
        module.name,
        module.exports
      ].join('/'),
      {
        scope: location.origin,
        type: 'module'
      }
    ];

    it('registers and connects the service worker', async() => {
      await handler.worker;

      expect(container.register).toHaveBeenCalledWith(...registered);
      expect(module.connect).toHaveBeenCalled();
    });

    it('returns the singleton handler', () => {
      expect(handler).toBe(new StateHandler());
    });
  });

  describe('deploying a store and dispatching an action', () => {
    const handle = 'sgrud.test.state.class';
    const handler = new StateHandler();
    const state = { param: undefined };

    const deployed = [
      handle,
      expect.any(Function),
      state,
      false
    ];

    const dispatched = [
      'setParam',
      ['next']
    ] as Store.Action<StoreClass>;

    it('correctly deploys the store and dispatches the action', (done) => {
      handler.deploy(handle, StoreClass, state).pipe(
        switchMap((store) => store.dispatch(...dispatched))
      ).subscribe(() => {
        expect(module.dispatch).toHaveBeenCalledWith(handle, dispatched);
        expect(module.deploy).toHaveBeenCalledWith(...deployed);
        done();
      });
    });
  });

  describe('dispatching an action', () => {
    const handle = 'sgrud.test.state.class';
    const handler = new StateHandler();

    const dispatched = [
      'setParam',
      ['next']
    ] as Store.Action<any>;

    it('correctly dispatches the action', (done) => {
      handler.dispatch(handle, ...dispatched).subscribe(() => {
        expect(module.dispatch).toHaveBeenCalledWith(handle, dispatched);
        done();
      });
    });
  });

  describe('deploying a store again and subscribing to its state', () => {
    const bus = new Subject<string>();
    const handle = 'sgrud.test.state.class';
    const handler = new StateHandler();
    const state = { param: undefined };

    it('correctly re-deploys the store and emits state changes', (done) => {
      const subscription = handler.deploy(handle, StoreClass, state).pipe(
        switchMap((store) => from(store))
      ).subscribe((value) => {
        expect(value).toBe('done');
        subscription.unsubscribe();
      });

      subscription.add(() => {
        bus.complete();
        done();
      });

      new BusHandler().set(handle, bus).subscribe();
      setTimeout(() => bus.next('done'), 250);
    });
  });

  describe('implanting an effect', () => {
    const handler = new StateHandler();
    const locate = 'test';

    const implantd = [
      locate,
      expect.any(Function)
    ];

    it('correctly implants the effect', (done) => {
      handler.implant(locate, EffectClass).subscribe(() => {
        expect(module.implant).toHaveBeenLastCalledWith(...implantd);
        done();
      });
    });
  });

  describe('instantiating a handler in a legacy environment', () => {
    const register = [
      [
        location.origin,
        'node_modules',
        module.name,
        module.unpkg
      ].join('/'),
      {
        scope: location.origin,
        type: 'classic'
      }
    ];

    it('returns the singleton handler', async() => {
      jest.resetModules();
      Object.assign(globalThis, { sgrud: true });

      const handler = new (require('@sgrud/state').StateHandler)();
      await expect(handler.worker).resolves.toBeInstanceOf(Function);
      expect(container.register).toHaveBeenCalledWith(...register);
      expect(module.connect).toHaveBeenCalled();
    });
  });

  describe('instantiating a handler in an incompatible environment', () => {
    it('throws an error', async() => {
      jest.resetModules();
      delete module.unpkg;

      const handler = new (require('@sgrud/state').StateHandler)();
      await expect(handler.worker).rejects.toThrowError(ReferenceError);
    });
  });

});
