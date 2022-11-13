import { provide, Provide } from './provide';
import { Registration, Registry } from './registry';

/**
 * Type helper to allow referencing [Provide][]d constructors as `new`-able
 * targets. Used and intended to be used in conjunction with the [Provider][]
 * decorator.
 *
 * [Provide]: https://sgrud.github.io/client/functions/core.Provide-1
 * [Provider]: https://sgrud.github.io/client/functions/core.Provider
 *
 * @typeParam V - Instance type.
 *
 * @see [Provider][]
 */
export interface Provider<V> {

  /**
   * Enforced provider contract.
   */
  readonly [provide]: Registration;

  /**
   * Enforced constructor contract.
   *
   * @param args - Class constructor rest parameter.
   */
  new (...args: any[]): V;

}

/**
 * **Provider** of base classes. Extending this mixin-style function while
 * supplying the `typeof` a [Provide][]d constructor enforces type safety and
 * hinting on the supplied magic string and the resulting class which `extends`
 * this **Provider** mixin. The main purpose of this pattern is bridging module
 * gaps by de-coupling bundle files while maintaining a well-defined prototype
 * chain. This still requires the base class to be defined (and [Provide][]d)
 * before extension but allows intellisense'd OOP patterns across multiple
 * modules while maintaining runtime language specifications.
 *
 * [Provide]: https://sgrud.github.io/client/functions/core.Provide-1
 * [Registry]: https://sgrud.github.io/client/classes/core.Registry
 *
 * @param provider - Magic string.
 * @typeParam V - Constructor type.
 * @typeParam K - Magic string type.
 * @returns Providing constructor.
 *
 * @example
 * Extend a provided class:
 * ```ts
 * import type { Base } from 'example-module';
 * import { Provider } from '@sgrud/core';
 *
 * export class Class
 *   extends Provider<typeof Base>('org.example.Base') {
 *
 *   public constructor(...args: any[]) {
 *     super(...args);
 *   }
 *
 * }
 * ```
 *
 * @see [Provide][]
 * @see [Registry][]
 */
export function Provider<
  V extends Provide<K, V>,
  K extends Registration = V[typeof provide]
>(provider: K): V {

  return new Registry<K, V>().get(provider);

}
