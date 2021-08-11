/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable @typescript-eslint/unbound-method */
import { expose, proxy, ProxyMarked, transferHandlers, wrap } from 'comlink';
import { Observable, Observer, Subscribable } from 'rxjs';

transferHandlers.set('observable', {
  canHandle: <T>(value: unknown): value is Observable<T> => {
    return value instanceof Observable;
  },
  deserialize: <T>(value: unknown) => {
    return new Observable<T>((observer) => {
      const subscribable = transferHandlers.get('proxy')!.deserialize(value);
      const subscription = (subscribable as Subscribable<T>).subscribe(proxy({
        next: (next: T) => observer.next(next),
        error: (error: unknown) => observer.error(error),
        complete: () => observer.complete()
      }));

      return () => subscription.unsubscribe();
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
