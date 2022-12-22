import { transferHandlers } from 'comlink';
import { Store } from '../store/store';

transferHandlers.set('store', {
  canHandle: (value: unknown): value is Store.Type<any> => {
    return (value as Store.Type<any>)?.prototype instanceof Store;
  },
  deserialize: (value: unknown) => {
    const store = class extends Store { };

    for (const key of Object.getOwnPropertyNames(value)) {
      // eslint-disable-next-line @typescript-eslint/no-implied-eval
      store.prototype[key as string & keyof Store] = new Function(
        `return (${(value as Record<string, string>)[key]});`
      )();
    }

    return store;
  },
  serialize: (value: Store.Type<any>) => {
    const store = { } as Record<string, string>;

    for (const key of Object.getOwnPropertyNames(value.prototype)) {
      if (!Store.prototype[key as keyof Store]) {
        const action = value.prototype[key as keyof Store];
        store[key] = action.toString().replace(/^[^(]+/, 'function');
      }
    }

    return [store, []];
  }
});
