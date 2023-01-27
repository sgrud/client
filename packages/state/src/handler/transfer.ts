/* eslint-disable @typescript-eslint/no-implied-eval */

import { transferHandlers } from 'comlink';
import { Effect } from '../effect/effect';
import { Store } from '../store/store';

transferHandlers.set('effect', {
  canHandle: (value: unknown): value is typeof Effect => {
    return value instanceof Function && value.prototype instanceof Effect;
  },
  deserialize: (value: unknown) => {
    // @ts-expect-error missing implementation
    const effect = class extends Effect { };

    Object.defineProperty(effect.prototype, 'function', {
      value: new Function(`return (${value as string});`)()
    });

    return effect;
  },
  serialize: ({ prototype }: typeof Effect) => {
    const effect = prototype.function.toString().replace(/^[^(]+/, 'function');
    return [effect, []];
  }
});

transferHandlers.set('store', {
  canHandle: (value: unknown): value is Store.Type<any> => {
    return value instanceof Function && value.prototype instanceof Store;
  },
  deserialize: (value: unknown) => {
    const store = class extends Store { };

    for (const key of Object.getOwnPropertyNames(value)) {
      Object.defineProperty(store.prototype, key, {
        value: new Function(
          `return (async ${(value as Record<string, string>)[key]});`
        )()
      });
    }

    return store;
  },
  serialize: ({ prototype }: Store.Type<any>) => {
    const store = { } as Record<string, string>;

    for (const key of Object.getOwnPropertyNames(prototype)) {
      if (!Store.prototype[key as keyof Store]) {
        const action = prototype[key as keyof Store];
        store[key] = action.toString().replace(/^[^(]+/, 'function');
      }
    }

    return [store, []];
  }
});
