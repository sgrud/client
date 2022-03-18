/* eslint-disable @typescript-eslint/no-var-requires */

import { expose, proxy, ProxyMarked, transferHandlers, wrap } from 'comlink';
import { Observable, Observer, Subscribable, Subscriber } from 'rxjs';
import { TypeOf } from '../utility/type-of';

/**
 * Observable transfer handler. This specific implementation of
 * [comlink.transferHandlers](https://www.npmjs.com/package/comlink#api) should
 * transparently proxy [rxjs](https://www.npmjs.com/package/rxjs) `Observable`
 * between a worker and the main threads.
 *
 * @see https://github.com/GoogleChromeLabs/comlink/issues/219
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
 * [comlink.transferHandlers](https://www.npmjs.com/package/comlink#api) should
 * transparently proxy [rxjs](https://www.npmjs.com/package/rxjs) `Subscriber`
 * between a worker and the main threads.
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
  const { MessageChannel } = require('worker_threads');
  const nodeEndpoint = require('comlink/dist/umd/node-adapter.min');

  /**
   * NodeJS proxy transfer handler. This specific implementation of
   * [comlink.transferHandlers](https://www.npmjs.com/package/comlink#api)
   * adopts the default `proxyTransferHandler` for usage under NodeJS.
   *
   * @see https://github.com/GoogleChromeLabs/comlink/issues/313
   */
  transferHandlers.set('proxy', {
    // eslint-disable-next-line @typescript-eslint/unbound-method
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
