import { Linker } from './linker';

/**
 * Type helper to allow [Factor][]ing **Target**ed constructors with required
 * arguments. Used and to be used in conjunction with the [Target][] decorator.
 *
 * [Factor]: https://sgrud.github.io/client/functions/core.Factor
 * [Target]: https://sgrud.github.io/client/functions/core.Target
 *
 * @typeParam V - Instance type.
 */
export interface Target<V> {

  /**
   * Enforced constructor contract.
   *
   * @param args - Constructor arguments.
   */
  new (...args: any[]): V;

}

/**
 * Class decorator factory. Links the **Target**ed constructor to its
 * corresponding instance by applying the supplied `factoryArgs`. Employ this
 * helper to link **Target**ed constructors with required arguments. Supplying a
 * `target` constructor overrides its linked instance, if any, with the
 * constructed instance.
 *
 * [Factor]: https://sgrud.github.io/client/functions/core.Factor
 * [Linker]: https://sgrud.github.io/client/classes/core.Linker
 *
 * @param factoryArgs - **Target** constructor arguments.
 * @param target - **Target** constructor override.
 * @typeParam K - Constructor type.
 * @returns Class decorator.
 *
 * @example
 * **Target** a service:
 * ```ts
 * import { Target } from '@sgrud/core';
 *
 * ⁠@Target<typeof Service>(['default'])
 * export class Service {
 *
 *   public constructor(
 *     public readonly param: string
 *   ) { }
 *
 * }
 * ```
 *
 * @example
 * [Factor][] a **Target**ed service:
 * ```ts
 * import type { Target } from '@sgrud/core';
 * import { Factor } from '@sgrud/core';
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
 * @see [Factor][]
 * @see [Linker][]
 */
export function Target<K extends new (...args: any[]) => any>(
  factoryArgs?: ConstructorParameters<K>,
  target?: K
) {

  /**
   * @param constructor - Class constructor to be decorated.
   */
  return function(
    constructor: K
  ): void {
    new Linker<K>([
      [target || constructor, new constructor(...factoryArgs || [])]
    ]);
  };

}
