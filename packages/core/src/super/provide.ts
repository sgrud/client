import { Registration, Registry } from './registry';

/**
 * Unique symbol used as property key by the {@link Provide} type constraint.
 */
export const provide = Symbol('@sgrud/core/super/provide');

/**
 * Type helper enforcing the {@link provide} symbol property to contain a magic
 * string (typed as {@link Registration}) on base constructors decorated with
 * the corresponding {@link Provide} decorator. The **Provide** type helper is
 * also used by the {@link Provider} decorator.
 *
 * @typeParam K - The magic string {@link Registration} type.
 * @typeParam V - The registered class constructor type.
 *
 * @see {@link Provide}
 */
export type Provide<
  K extends Registration,
  V extends abstract new (...args: any[]) => InstanceType<V>
> = (abstract new (...args: any[]) => InstanceType<V>) & {

  /**
   * Enforced contract. This **provide** symbol property must be typed as
   * {@link Registration} and assigned a magic string used by the
   * {@link Provider} to lookup the providing class.
   */
  readonly [provide]: K extends Registration ? K : Registration;

};

/**
 * Class decorator factory. **Provide**s the decorated class to extending
 * classes. Applying the **Provide** decorator enforces the {@link Provide} type
 * which entails the declaration of a static {@link provide} property typed as
 * {@link Registration}. The magic string assigned to this static property is
 * used by the {@link Provider} factory function to get base classes from the
 * {@link Registry}.
 *
 * @typeParam K - The magic string {@link Registration} type.
 * @typeParam V - The registered class constructor type.
 * @returns A class constructor decorator.
 *
 * @example
 * **Provide** a base class:
 * ```ts
 * import { Provide, provide } from '@sgrud/core';
 *
 * ⁠@Provide()
 * export abstract class Base {
 *
 *   public static readonly [provide] = 'sgrud.example.Base' as const;
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
   * @param constructor - The class `constructor` to be decorated.
   */
  return function(constructor: V): void {
    new Registry([
      [constructor[provide], constructor]
    ]);
  };

}
