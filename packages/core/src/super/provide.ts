import { Registration, Registry } from './registry';

/**
 * Symbol used as property key by the {@link Provide} decorator to enforce the
 * provider contract.
 *
 * @see {@link Provide}
 * @see {@link Provider}
 */
export const provide = Symbol('@sgrud/core/super/provide');

/**
 * Type helper enforcing the {@link provide} symbol property containing a magic
 * string (typed as {@link Provider}) on base constructors decorated with the
 * corresponding `@Provide()` decorator.
 *
 * @typeParam K - Magic string type.
 * @typeParam V - Providing constructor type.
 *
 * @see {@link Provider}
 */
export type Provide<
  K extends Registration,
  V extends abstract new (...args: any[]) => InstanceType<V>
> = (abstract new (...args: any[]) => InstanceType<V>) & {

  /**
   * Enforced provider contract. The {@link provide} symbol property must be
   *  typed as {@link Registration} and containing a magic string used by the
   *  {@link Provider} to lookup the providing class.
   *
   * @see {@link Registration}
   */
  readonly [provide]: K extends Registration ? K : Registration;

};

/**
 * Class decorator factory. Provides the decorated constructor by magic string
 * to extending classes. Applying this decorator enforces the corresponding
 * `Provide` type and thereby the provider constraint on the decorated class,
 * i.e., constructor. This contract enforces the declaration of a (static)
 * {@link provide} symbol property typed as {@link Registration}. The magic
 * string value of this static property is used by the {@link Provider} to
 * lookup base constructors within the {@link Registry} map.
 *
 * @typeParam V - Providing constructor type.
 * @typeParam K - Magic string type.
 * @returns Class decorator.
 *
 * @example Provide a base class.
 * ```ts
 * import { Provide, provide } from '@sgrud/core';
 *
 * @Provide<typeof Base>()
 * export abstract class Base {
 *
 *   public static readonly [provide]:
 *   'sgrud.example.Base' = 'sgrud.example.Base';
 *
 * }
 * ```
 *
 * @see {@link Provider}
 * @see {@link Registry}
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
