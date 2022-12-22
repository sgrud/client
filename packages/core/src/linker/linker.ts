import { Singleton } from '../utility/singleton';

/**
 * The [Singleton][] **Linker** class provides the means to lookup instances of
 * [Target][]ed constructors. The **Linker** is used throughout the [SGRUD][]
 * client libraries, e.g., by the [Factor][] decorator, to provide and retrieve
 * different centrally provisioned class instances. To programmatically insert
 * some links, the inherited *constructor* or *set* methods can be used. The
 * former will insert all entries into this [Singleton][] link mapping,
 * internally calling the latter for each.
 *
 * [Factor]: https://sgrud.github.io/client/functions/core.Factor
 * [Singleton]: https://sgrud.github.io/client/functions/core.Singleton
 * [SGRUD]: https://sgrud.github.io
 * [Target]: https://sgrud.github.io/client/functions/core.Target
 *
 * @decorator [Singleton][]
 * @typeParam K - Constructor type.
 * @typeParam V - Instance type.
 *
 * @example
 * Preemptively link an instance:
 * ```ts
 * import { Linker } from '@sgrud/core';
 * import { Service } from './service';
 *
 * new Linker<typeof Service>([
 *   [Service, new Service('linked')]
 * ]);
 * ```
 */
@Singleton<typeof Linker>((linker, [tuples]) => {
  if (tuples) {
    for (const [key, value] of tuples) {
      linker.set(key, value);
    }
  }

  return linker;
})
export class Linker<
  K extends abstract new () => V,
  V = InstanceType<K>
> extends Map<K, V> {

  /**
   * Overridden **get** method. Calling this method looks up the linked instance
   * based on the supplied `target` constructor. If no linked instance is found,
   * one is created by calling the `new` operator on the `target` constructor.
   * Therefor the `target` constructors must not require parameters.
   *
   * @param target - Target constructor.
   * @returns Linked instance.
   *
   * @example
   * Retrieve a linked instance:
   * ```ts
   * import { Linker } from '@sgrud/core';
   * import { Service } from './service';
   *
   * new Linker<typeof Service>().get(Service);
   * ```
   */
  public override get(target: K): V {
    let instance = super.get(target);

    if (!instance) {
      instance = new (target as unknown as new () => V)();
      this.set(target, instance);
    }

    return instance;
  }

  /**
   * Returns all linked instances, which satisfy `instanceof target`. Use this
   * method when multiple linked `target` constructors extend the same base
   * class and are to be retrieved.
   *
   * @param target - Target constructor.
   * @returns All linked instances.
   *
   * @example
   * Retrieve all linked instances:
   * ```ts
   * import { Linker } from '@sgrud/core';
   * import { Service } from './service';
   *
   * new Linker<typeof Service>().getAll(Service);
   * ```
   */
  public getAll(target: K): V[] {
    const instances = [];
    const values = this.values();

    for (const instance of values) {
      if (instance instanceof target) {
        instances.push(instance);
      }
    }

    return instances;
  }

}
