import { transferHandlers } from 'comlink';
import { Effect } from './effect';

/**
 * Custom addition to the {@link transferHandlers}, allowing values of type
 * {@link Store} to be transparently transferred between endpoints.
 */
transferHandlers.set('effect', {
  canHandle: (value: unknown): value is typeof Effect => {
    return (value as Function | undefined)?.prototype instanceof Effect;
  },
  deserialize: (value: string) => {
    // @ts-expect-error missing implementation
    const effect = class extends Effect {};

    Object.defineProperty(effect.prototype, 'function', {
      // eslint-disable-next-line @typescript-eslint/no-implied-eval
      value: new Function(`return (${value});`)()
    });

    return effect;
  },
  serialize: (value: typeof Effect) => {
    const method = value.prototype.function.toString();
    const effect = method.replace(/^[^(]+/, 'function');
    return [effect, []];
  }
});
