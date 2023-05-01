import { Linker } from './linker';

/**
 * Prototype property decorator factory. Applying this decorator replaces the
 * decorated prototype property with a getter, which returns the linked instance
 * of a {@link Target}ed constructor, referenced by the `targetFactory`.
 * Depending on the supplied `transient` value, the target constructor is
 * invoked to construct (and link) an instance, if none is linked beforehand.
 *
 * @param targetFactory - A forward reference to the target constructor.
 * @param transient - Wether an instance is constructed if none is linked.
 * @typeParam K - The {@link Target}ed constructor type.
 * @returns A prototype property decorator.
 *
 * @example
 * **Factor** an eager and lazy service:
 * ```ts
 * import { Factor } from '@sgrud/core';
 * import { EagerService, LazyService } from './services';
 *
 * export class ServiceHandler {
 *
 *   ⁠@Factor(() => EagerService)
 *   private readonly service!: EagerService;
 *
 *   ⁠@Factor(() => LazyService, true)
 *   private readonly service?: LazyService;
 *
 * }
 * ```
 *
 * @see {@link Linker}
 * @see {@link Target}
 */
export function Factor<K extends new () => any>(
  targetFactory: () => K,
  transient: boolean = false
) {

  /**
   * @param prototype - The `prototype` to be decorated.
   * @param propertyKey - The `prototype` property to be decorated.
   */
  return function(prototype: object, propertyKey: PropertyKey): void {
    Object.defineProperty(prototype, propertyKey, {
      enumerable: true,
      get: (): InstanceType<K> | undefined => {
        const linker = new Linker<K>();

        if (transient && !linker.has(targetFactory())) {
          return undefined;
        }

        return linker.get(targetFactory());
      },
      set: Function.prototype as (...args: any[]) => any
    });
  };

}
