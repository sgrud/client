/* eslint-disable @typescript-eslint/no-var-requires */

import { expose, proxy, ProxyMarked, proxyMarker, transferHandlers, wrap } from 'comlink';
import { Observable, Observer, Subscribable, Subscriber } from 'rxjs';
import { TypeOf } from '../utility/type-of';

/**
 * [Comlink][] **transferHandler** for values of type [Observable][]. This
 * custom implementation of a [Comlink][] **transferHandler** transparently
 * proxies [Observable][] streams between two [Comlink][] endpoints.
 *
 * [Comlink]: https://www.npmjs.com/package/comlink
 * [Observable]: https://rxjs.dev/api/index/class/Observable
 *
 * @remarks https://github.com/GoogleChromeLabs/comlink/issues/219
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
 * [Comlink][] **transferHandler** for values of type [Subscriber][]. This
 * custom implementation of a [Comlink][] **transferHandler** transparently
 * proxies the [Subscriber][] to a previously proxied [Observable][] stream
 * between two [Comlink][] endpoints.
 *
 * [Comlink]: https://www.npmjs.com/package/comlink
 * [Observable]: https://rxjs.dev/api/index/class/Observable
 * [Subscriber]: https://rxjs.dev/api/index/class/Subscriber
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
  const nodeEndpoint = require('comlink/dist/umd/node-adapter');

  /**
   * Overridden default [Comlink][] *proxyTransferHandler* **transferHandler**.
   * This custom implementation of a [Comlink][] **transferHandler** adopts the
   * default [Comlink][] *proxyTransferHandler* for usage under NodeJS.
   *
   * [Comlink]: https://www.npmjs.com/package/comlink
   *
   * @remarks https://github.com/GoogleChromeLabs/comlink/issues/313
   */
  transferHandlers.set('proxy', {
    canHandle: (value: unknown): value is ProxyMarked => {
      return value instanceof Object && proxyMarker in value;
    },
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
