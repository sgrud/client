import { Singleton } from '../utility/singleton';
import { Target } from './target';

/**
 * The {@link Singleton} **Linker** class provides the means to lookup and
 * retrieve instances of {@link Target}ed constructors. The **Linker** is used
 * throughout the [SGRUD](https://sgrud.github.io) client libraries, e.g., by
 * the {@link Factor} decorator, to provide and retrieve different centrally
 * provisioned class instances.
 *
 * @decorator {@link Singleton}
 * @typeParam K - The {@link Target}ed constructor type.
 * @typeParam V - The {@link Target}ed {@link InstanceType}.
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
@Singleton((linker, [tuples]) => {
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
   * @param target - The `target` constructor for which to retrieve an instance.
   * @returns The already linked or a newly constructed and linked instance.
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
      this.set(target, instance = new (target as unknown as Target<V>)());
    }

    return instance;
  }

  /**
   * The **getAll** method returns all linked instances, which satisfy
   * `instanceof target`. Use this method when multiple linked `target`
   * constructors extend the same base class and are to be retrieved.
   *
   * @param target - The `target` constructor for which to retrieve instances.
   * @returns All already linked instance of the `target` constructor.
   *
   * @example
   * Retrieve all linked instances of a `Service`:
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
