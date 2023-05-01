import { Linker } from './linker';

/**
 * Type helper to allow {@link Factor}ing **Target**ed constructors with
 * required arguments. Used and to be used in conjunction with the
 * {@link Target} decorator.
 *
 * @typeParam V - The **Target**ed {@link InstanceType}.
 */
export type Target<V> = new (...args: any[]) => V;

/**
 * Class decorator factory. Links the **Target**ed constructor to its
 * corresponding instance by applying the supplied `factoryArgs`. Employ this
 * helper to link **Target**ed constructors with required arguments. Supplying a
 * `target` constructor overrides its linked instance, if any, with the
 * constructed instance.
 *
 * @param factoryArgs - The arguments for the **Target**ed constructor.
 * @param target - An optional **Target** constructor to override.
 * @typeParam K - The **Target**ed constructor type.
 * @returns A class constructor decorator.
 *
 * @example
 * **Target** a service:
 * ```ts
 * import { Target } from '@sgrud/core';
 *
 * ⁠@Target(['default'])
 * export class Service {
 *
 *   public constructor(
 *     public readonly param: string
 *   ) {}
 *
 * }
 * ```
 *
 * @example
 * {@link Factor} a **Target**ed service:
 * ```ts
 * import { Factor, type Target } from '@sgrud/core';
 * import { Service } from './service';
 *
 * export class ServiceHandler {
 *
 *   ⁠@Factor<Target<Service>>(() => Service)
 *   public readonly service!: Service;
 *
 * }
 * ```
 *
 * @see {@link Factor}
 * @see {@link Linker}
 */
export function Target<K extends new (...args: any[]) => any>(
  factoryArgs?: ConstructorParameters<K>,
  target?: K
) {

  /**
   * @param constructor - The class `constructor` to be decorated.
   */
  return function(constructor: K): void {
    new Linker<K>([
      [target || constructor, new constructor(...factoryArgs || [])]
    ]);
  };

}
