import { Linker } from './linker';

/**
 * Prototype property decorator factory. Replaces the decorated prototype
 * property with a getter, which looks up the linked instance of a target
 * constructor forwarded-referenced by the `linkFactory()`.
 *
 * @param targetFactory - Forward reference to the target constructor.
 * @typeParam K - Target constructor type.
 * @returns Prototype property decorator.
 *
 * @example Factor a service.
 * ```ts
 * import { Factor } from '@sgrud/core';
 * import { Service } from './service';
 *
 * export class ServiceHandler {
 *
 *   @Factor(() => Service)
 *   private readonly service!: Service;
 *
 * }
 * ```
 *
 * @see {@link Linker}
 * @see {@link Target}
 */
export function Factor<K extends new () => any>(
  targetFactory: () => K
) {

  /**
   * @param prototype - Prototype to be decorated.
   * @param propertyKey - Prototype property to be decorated.
   */
  return function(
    prototype: Object,
    propertyKey: PropertyKey
  ): void {
    Object.defineProperty(prototype, propertyKey, {
      enumerable: true,
      get: () => new Linker().get(targetFactory())
    });
  };

}
