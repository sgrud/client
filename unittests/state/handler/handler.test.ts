/* eslint-disable @typescript-eslint/no-var-requires */

import { BusHandler } from '@sgrud/bus';
import { Mutable } from '@sgrud/core';
import { StateHandler, Store } from '@sgrud/state';
import { expose } from 'comlink';
import nodeEndpoint from 'comlink/dist/umd/node-adapter';
import express from 'express';
import { Server } from 'http';
import { from, Subject, switchMap } from 'rxjs';
import { MessageChannel } from 'worker_threads';

declare global {
  // eslint-disable-next-line no-var
  var sgrud: boolean;
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
    dispatch: jest.fn()
  };

  class Class extends Store<Class> {
    public readonly param?: string;
    public setParam(param: string): Store.State<this> {
      return { ...this, param };
    }
  }

  describe('instantiating a handler', () => {
    const handler = new StateHandler();

    const register = [
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

    it('returns the singleton handler', async() => {
      await handler.worker;
      expect(handler).toBe(new StateHandler());
      expect(container.register).toHaveBeenCalledWith(...register);
      expect(module.connect).toHaveBeenCalled();
    });
  });

  describe('deploying a store and dispatching an action', () => {
    const handler = new StateHandler();
    const handle = 'sgrud.test.state';
    const seed = { param: undefined };

    const deploy = [
      handle,
      expect.any(Function),
      seed,
      false
    ];

    const dispatch = [
      'setParam',
      ['next']
    ] as Store.Action<Class>;

    it('correctly deploys the store and dispatches the action', (done) => {
      handler.deploy(handle, Class, seed).pipe(
        switchMap((store) => store.dispatch(...dispatch))
      ).subscribe(() => {
        expect(module.dispatch).toHaveBeenCalledWith(handle, dispatch);
        expect(module.deploy).toHaveBeenCalledWith(...deploy);
        done();
      });
    });
  });

  describe('deploying a store again and subscribing to its state', () => {
    const bus = new Subject<string>();
    const handle = 'sgrud.test.state';
    const handler = new StateHandler();
    const seed = { param: undefined };

    it('correctly re-deploys the store and emits state changes', (done) => {
      const subscription = handler.deploy(handle, Class, seed).pipe(
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
      globalThis.sgrud = true;

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
