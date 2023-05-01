/**
 * Class decorator factory. Enforces a transparent **Singleton** pattern on the
 * decorated class. When calling the `new` operator on a decorated class for the
 * first time, an instance of the decorated class is created using the supplied
 * arguments, if any. This instance will remain the **Singleton** instance of
 * the decorated class indefinitely. When calling the `new` operator on a
 * decorated class already instantiated, the **Singleton** pattern is enforced
 * and the previously constructed instance is returned. Instead, if provided,
 * the `apply` callback is fired with the **Singleton** instance and the `new`
 * invocation parameters.
 *
 * @param apply - The callback to `apply` on subsequent `new` invocations.
 * @typeParam T - The type of the decorated constructor.
 * @returns A class constructor decorator.
 *
 * @example
 * **Singleton** class:
 * ```ts
 * import { Singleton } from '@sgrud/core';
 *
 * ⁠@Singleton()
 * export class Service {}
 *
 * new Service() === new Service(); // true
 * ```
 */
export function Singleton<T extends new (...args: any[]) => any>(
  apply?: (
    self: InstanceType<T>,
    args: ConstructorParameters<T>
  ) => InstanceType<T>
) {

  /**
   * @param constructor - The class `constructor` to be decorated.
   * @returns The decorated class `constructor`.
   */
  return function(constructor: T): T {
    class Class extends constructor {

      public constructor(...args: any[]) {
        if (!self) {
          super(...args);
          self = this;
        } else {
          return apply?.(
            self as InstanceType<T>,
            args as ConstructorParameters<T>
          ) || self;
        }
      }

    }

    let self: Class;
    return Class;
  };

}
