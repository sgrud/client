import { Registration, Registry } from './registry';

/**
 * Unique symbol used as property key by the [Provide][] type constraint.
 *
 * [Provide]: https://sgrud.github.io/client/types/core.Provide
 */
export const provide = Symbol('@sgrud/core/super/provide');

/**
 * Type helper enforcing the [provide][] symbol property containing a magic
 * string (typed as [Registration][]) on base constructors decorated with the
 * corresponding [Provide][] decorator. The **Provide** type helper is also used
 * by the [Provider][] decorator.
 *
 * [provide]: https://sgrud.github.io/client/variables/core.provide-2
 * [Provide]: https://sgrud.github.io/client/functions/core.Provide-1
 * [Provider]: https://sgrud.github.io/client/functions/core.Provider
 * [Registration]: https://sgrud.github.io/client/types/core.Registration
 *
 * @typeParam K - Magic string type.
 * @typeParam V - Constructor type.
 *
 * @see [Provide][]
 */
export type Provide<
  K extends Registration,
  V extends abstract new (...args: any[]) => InstanceType<V>
> = (abstract new (...args: any[]) => InstanceType<V>) & {

  /**
   * Enforced contract. This **provide** symbol property must be typed as
   * [Registration][] and assigned a magic string used by the [Provider][] to
   * lookup the providing class.
   *
   * [Provider]: https://sgrud.github.io/client/functions/core.Provider
   * [Registration]: https://sgrud.github.io/client/types/core.Registration
   */
  readonly [provide]: K extends Registration ? K : Registration;

};

/**
 * Class decorator factory. **Provide**s the decorated class to extending
 * classes. Applying the **Provide** decorator enforces the [Provide][] type
 * which entails the declaration of a static [provide][] property typed as
 * [Registration][]. The magic string assigned to this static property is used
 * by the [Provider][] factory function to lookup base classes within the
 * [Registry][] mapping.
 *
 * [Provide]: https://sgrud.github.io/client/types/core.Provide
 * [provide]: https://sgrud.github.io/client/variables/core.provide-2
 * [Provider]: https://sgrud.github.io/client/functions/core.Provider
 * [Registration]: https://sgrud.github.io/client/types/core.Registration
 * [Registry]: https://sgrud.github.io/client/classes/core.Registry
 *
 * @typeParam K - Magic string type.
 * @typeParam V - Constructor type.
 * @returns Class decorator.
 *
 * @example
 * **Provide** a base class:
 * ```ts
 * import { Provide, provide } from '@sgrud/core';
 *
 * ⁠@Provide<typeof Base>()
 * export abstract class Base {
 *
 *   public static readonly [provide]:
 *   'sgrud.example.Base' = 'sgrud.example.Base' as const;
 *
 * }
 * ```
 *
 * @see [Provider][]
 * @see [Registry][]
 */
export function Provide<
  V extends Provide<K, V>,
  K extends Registration = V[typeof provide]
>() {

  /**
   * @param constructor - Class constructor to be decorated.
   */
  return function(
    constructor: V
  ): void {
    new Registry([
      [constructor[provide], constructor]
    ]);
  };

}
