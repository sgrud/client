import { Linker } from './linker';

/**
 * Type helper to allow {@link Factor}ing targeted constructors with required
 * arguments. Use in conjunction with the `@Target()` decorator.
 *
 * @typeParam V - Linked instance type.
 *
 * @see {@link Factor}
 */
export interface Target<V> {

  /**
   * Enforced constructor contract.
   *
   * @param args - Class constructor rest parameter.
   * @returns Linked instance.
   */
  new (...args: any[]): V;

}

/**
 * Class decorator factory. Links the decorated target constructor to its
 * corresponding instance by applying the decorated constructor arguments.
 * Employ this helper to link target constructors with required arguments.
 *
 * @param factoryArgs - Arguments for the target constructor.
 * @typeParam K - Target constructor type.
 * @returns Class decorator.
 *
 * @example Target a service.
 * ```ts
 * import { Target } from '@sgrud/core';
 *
 * @Target<typeof Service>('default')
 * export class Service {
 *
 *   public constructor(
 *     public readonly param: string
 *   ) { }
 *
 * }
 * ```
 *
 * @example Factor a targeted service.
 * ```ts
 * import { Factor } from '@sgrud/core';
 * import type { Target } from '@sgrud/core';
 * import { Service } from './service';
 *
 * export class ServiceHandler {
 *
 *   @Factor<Target<Service>>(() => Service)
 *   public readonly service!: Service;
 *
 * }
 * ```
 *
 * @see {@link Factor}
 * @see {@link Linker}
 */
export function Target<K extends new (...args: any[]) => any>(
  ...factoryArgs: ConstructorParameters<K>
) {

  /**
   * @param constructor - Class constructor to be decorated.
   */
  return function(
    constructor: K
  ): void {
    new Linker<K>([
      [constructor, new constructor(...factoryArgs)]
    ]);
  };

}
