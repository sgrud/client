import { Linker } from './linker';

/**
 * Type helper to allow uplinking targeted constructors with required arguments.
 * Use in conjunction with the `@Target()` decorator.
 *
 * @typeParam V - Linked instance type.
 */
export type Target<V> = new (...args: any[]) => V;

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
 * import { Target } from '@sgrud/utils';
 *
 * @Target<typeof Service>('default')
 * export class Service {
 *   public constructor(param: string) { }
 * }
 * ```
 *
 * @example Uplink a targeted service.
 * ```ts
 * import { Target, Uplink } from '@sgrud/utils';
 * import { Service } from './service';
 *
 * export class ServiceHandler {
 *   @Uplink<Target<Service>>(() => Service)
 *   private readonly service!: Service;
 * }
 * ```
 *
 * @see {@link Linker}
 * @see {@link Uplink}
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
    new Linker([
      [constructor, new constructor(...factoryArgs)]
    ]);
  };

}
