import { Singleton } from '../utility/singleton';

/**
 * Linker is the {@link Singleton} link map used by the {@link Factor} decorator
 * to lookup the linked instances of targeted constructors. To programmatically
 * insert some links, the inherited `MapConstructor` or `Map.prototype.set`
 * methods are available. The former will insert all entries into this singleton
 * link map, internally calling the latter for each.
 *
 * @decorator {@link Singleton}
 * @typeParam K - Target constructor type.
 * @typeParam V - Linked instance type.
 *
 * @example Preemptively link an instance.
 * ```ts
 * import { Linker } from '@sgrud/core';
 * import { Service } from './service';
 *
 * new Linker<typeof Service>([
 *   [Service, new Service('linked')]
 * ]);
 * ```
 *
 * @see {@link Factor}
 * @see {@link Target}
 */
@Singleton<typeof Linker>((self, [tuples]) => {
  if (tuples) {
    for (const [key, value] of tuples) {
      self.set(key, value);
    }
  }

  return self;
})
export class Linker<
  K extends abstract new () => V,
  V = InstanceType<K>
> extends Map<K, V> {

  /**
   * Overridden `Map.prototype.get` method. Looks up the linked instance based
   * on the target constructor. If no linked instance is found, one is created
   * by calling the `new` operator on the target constructor. Therefor the
   * target constructors must not require parameters (i.e. all parameters have
   * to be optional).
   *
   * @param target - Target constructor.
   * @returns Linked instance.
   *
   * @example Retrieve a linked instance.
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
   * method when multiple linked constructors extend the same base class and are
   * to be retrieved.
   *
   * @param target - Target constructor.
   * @returns Linked instances.
   *
   * @example Retrieve all linked instances.
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
