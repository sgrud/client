import { transferHandlers } from 'comlink';
import { Store } from './store';

/**
 * Custom addition to the {@link transferHandlers}, allowing values of type
 * {@link Store} to be transparently transferred between endpoints.
 */
transferHandlers.set('store', {
  canHandle: (value: unknown): value is Store.Type<Store> => {
    return (value as Function | undefined)?.prototype instanceof Store;
  },
  deserialize: (value: Record<string, string>) => {
    const store = class extends Store {};

    for (const key of Object.getOwnPropertyNames(value)) {
      Object.defineProperty(store.prototype, key, {
        // eslint-disable-next-line @typescript-eslint/no-implied-eval
        value: new Function(`return (async ${value[key]});`)()
      });
    }

    return store;
  },
  serialize: (value: Store.Type<Store>) => {
    const store = {} as Record<string, string>;

    for (const key of Object.getOwnPropertyNames(value.prototype)) {
      if (!Store.prototype[key as keyof Store]) {
        const method = value.prototype[key as keyof Store].toString();
        store[key] = method.replace(/^[^(]+/, 'function');
      }
    }

    return [store, []];
  }
});
