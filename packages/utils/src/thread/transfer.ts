/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable @typescript-eslint/unbound-method */

import { expose, proxy, ProxyMarked, transferHandlers, wrap } from 'comlink';
import { Observable, Observer, Subscribable } from 'rxjs';

/**
 * Observable transfer handler. This specific implementation of
 * {@link https://www.npmjs.com/package/comlink#api|comlink.transferHandlers}
 * should transparently proxy {@link https://www.npmjs.com/package/rxjs|rxjs}
 * `Observables` and the like between a worker and the main threads.
 *
 * @see {@link https://github.com/GoogleChromeLabs/comlink/issues/219}
 */
transferHandlers.set('observable', {
  canHandle: <T>(value: unknown): value is Observable<T> => {
    return value instanceof Observable;
  },
  deserialize: <T>(value: unknown) => {
    return new Observable<T>((observer) => {
      value = transferHandlers.get('proxy')!.deserialize(value);
      return (value as Subscribable<T>).subscribe(proxy({
        next: (next: T) => observer.next(next),
        error: (error: unknown) => observer.error(error),
        complete: () => observer.complete()
      }));
    });
  },
  serialize: <T>(value: Observable<T>) => {
    return transferHandlers.get('proxy')!.serialize({
      subscribe: (observer: Observer<T>) => {
        return value.subscribe({
          next: (next: T) => observer.next(next),
          error: (error: unknown) => observer.error(error),
          complete: () => observer.complete()
        });
      }
    });
  }
});

if (typeof process !== 'undefined') {
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
