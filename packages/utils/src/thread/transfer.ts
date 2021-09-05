/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable @typescript-eslint/unbound-method */

import { expose, proxy, ProxyMarked, transferHandlers, wrap } from 'comlink';
import { Observable, Observer, Subscribable, Subscriber } from 'rxjs';
import { TypeOf } from '../typing/type-of';

/**
 * Observable transfer handler. This specific implementation of
 * {@link https://www.npmjs.com/package/comlink#api|comlink.transferHandlers}
 * should transparently proxy {@link https://www.npmjs.com/package/rxjs|rxjs}
 * `Observable` between a worker and the main threads.
 *
 * @see {@link https://github.com/GoogleChromeLabs/comlink/issues/219}
 */
transferHandlers.set('observable', {
  canHandle: (value: unknown): value is Observable<unknown> => {
    return value instanceof Observable;
  },
  deserialize: (value: unknown) => {
    return new Observable<unknown>((observer) => {
      value = transferHandlers.get('proxy')!.deserialize(value);
      (value as Subscribable<unknown>).subscribe(proxy({
        next: (next: unknown) => observer.next(next),
        error: (error: unknown) => observer.error(error),
        complete: () => observer.complete()
      }));
    });
  },
  serialize: (value: Observable<unknown>) => {
    return transferHandlers.get('proxy')!.serialize({
      subscribe: (observer: Observer<unknown>) => {
        return value.subscribe({
          next: (next: unknown) => observer.next(next),
          error: (error: unknown) => observer.error(error),
          complete: () => observer.complete()
        });
      }
    });
  }
});

/**
 * Subscriber transfer handler. This specific implementation of
 * {@link https://www.npmjs.com/package/comlink#api|comlink.transferHandlers}
 * should transparently proxy {@link https://www.npmjs.com/package/rxjs|rxjs}
 * `Subscriber` between a worker and the main threads.
 */
transferHandlers.set('subscriber', {
  canHandle: (value: unknown): value is Subscriber<unknown> => {
    return value instanceof Subscriber;
  },
  deserialize: (value: unknown) => {
    return transferHandlers.get('proxy')!.deserialize(value);
  },
  serialize: (value: Subscriber<unknown>) => {
    return transferHandlers.get('proxy')!.serialize(value);
  }
});

if (TypeOf.process(globalThis.process)) {
  const nodeEndpoint = require('comlink/dist/umd/node-adapter.min');
  const { MessageChannel } = require('worker_threads');

  /**
   * NodeJS proxy transfer handler. This specific implementation of
   * {@link https://www.npmjs.com/package/comlink#api|comlink.transferHandlers}
   * adopts the default `proxyTransferHandler` for useage under NodeJS.
   *
   * @see {@link https://github.com/GoogleChromeLabs/comlink/issues/313}
   */
  transferHandlers.set('proxy', {
    canHandle: transferHandlers.get('proxy')!.canHandle,
    deserialize: (value: unknown) => {
      return wrap(nodeEndpoint(value));
    },
    serialize: (value: ProxyMarked) => {
      const { port1, port2 } = new MessageChannel();
      expose(value, nodeEndpoint(port1));
      return [port2, [port2]];
    }
  });
}
