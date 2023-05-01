import { provide, Provide } from './provide';
import { Registration, Registry } from './registry';

/**
 * Type helper to allow referencing {@link Provide}d constructors as `new`-able
 * targets. Used and intended to be used in conjunction with the
 * {@link Provider} decorator.
 *
 * @typeParam V - Instance type of the registered class constructor.
 *
 * @see {@link Provider}
 */
export interface Provider<V> {

  /**
   * Enforced provider contract.
   */
  readonly [provide]: Registration;

  /**
   * Enforced constructor contract.
   *
   * @param args - The default class constructor rest parameter.
   */
  new(...args: any[]): V;

}

/**
 * **Provider** of base classes. Extending this mixin-style function while
 * supplying the `typeof` a {@link Provide}d constructor enforces type safety
 * and hinting on the supplied magic string and the resulting class which
 * `extends` this **Provider** mixin. The main purpose of this pattern is
 * bridging module gaps by de-coupling bundle files while maintaining a
 * well-defined prototype chain. This still requires the base class to be
 * defined (and {@link Provide}d) before extension but allows intellisense'd OOP
 * patterns across multiple modules while maintaining runtime language
 * specifications.
 *
 * @param provider - A magic string to retrieve the `provider` by.
 * @typeParam V - The registered class constructor type.
 * @typeParam K - The magic string {@link Registration} type.
 * @returns The constructor which {@link Provide}s the {@link Registration}.
 *
 * @example
 * Extend a provided class:
 * ```ts
 * import { Provider } from '@sgrud/core';
 * import { type Base } from 'example-module';
 *
 * export class Class
 *   extends Provider<typeof Base>('sgrud.example.Base') {
 *
 *   public constructor(...args: any[]) {
 *     super(...args);
 *   }
 *
 * }
 * ```
 *
 * @see {@link Provide}
 * @see {@link Registry}
 */
export function Provider<
  V extends Provide<K, V>,
  K extends Registration = V[typeof provide]
>(provider: K): V {

  return new Registry<K, V>().get(provider);

}
