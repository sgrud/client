/**
 * Class decorator factory. Enforces transparent singleton pattern on decorated
 * class. When calling the `new` operaor on a decorated class, if provided, the
 * `apply` callback is fired with the singleton instence and the construction
 * invocation parameters.
 *
 * @param apply - Construct function.
 * @typeParam T - Constructor type.
 * @returns Class decorator.
 *
 * @example Singleton class.
 * ```ts
 * import { Singleton } from '@sgrud/utils';
 *
 * @Singleton<typeof Service>()
 * export class Service { }
 * ```
 */
export function Singleton<T extends new (...args: any[]) => any>(
  apply?: (
    self: InstanceType<T>,
    args: ConstructorParameters<T>
  ) => InstanceType<T>
) {

  /**
   * @param constructor - Class constructor to be decorated.
   * @returns Decoated class constructor.
   */
  return function(
    constructor: T
  ): T {
    class Class extends constructor {

      public constructor(...args: any[]) {
        if (!self) {
          super(...args);
          self = this;
        }

        return apply?.(
          self as InstanceType<T>,
          args as ConstructorParameters<T>
        ) || self;
      }

    }

    let self: Class;
    return Class;
  };

}
