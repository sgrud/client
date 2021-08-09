/**
 * Singleton interface enforcing the `reconstruct` method on implementing
 * classes. When a `@Singleton()` decorated class implements this interface, its
 * `reconstruct` method will be called every time the singleton instance is
 * retreived via the `new` operator.
 */
export interface Singleton<T extends new (...args: any[]) => any> {
  reconstruct: (...args: ConstructorParameters<T>) => void;
}

/**
 * Class decorator factory. Enforces transparent singleton pattern on decorated
 * class.
 *
 * @param construct - Construct function.
 * @returns Generic class decorator.
 *
 * @example SIngleton class.
 * ```ts
 * import { Singleton } from '@sgrud/util';
 *
 * @Singleton()
 * class MySingleton {
 * }
 * ```
 */
export function Singleton<T extends new (...args: any[]) => any>(
  construct?: (
    instance: InstanceType<T>,
    ...args: ConstructorParameters<T>
  ) => void
) {

  /**
   * @param constructor - Class constructor to be decorated.
   * @typeParam T - Class constructor type.
   * @returns Decoated class constructor.
   */
  return function(
    constructor: T
  ): T {
    let singleton: InstanceType<T>;

    return class extends constructor {

      public constructor(...args: any[]) {
        if (!singleton) {
          super(...args);
          singleton = this as InstanceType<T>;
          construct?.(singleton, ...args as ConstructorParameters<T>);
        }

        singleton.reconstruct?.(...args);
        return singleton;
      }

    };
  };

}
