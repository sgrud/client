import { Singleton } from '../singleton';

/**
 * Linker is the {@link Singleton} link map used by {@link Uplink} to lookup the
 * linked instances of targeted constructors. To preemptively insert some links,
 * the inherited `MapConstructor` or `Map.prototype.set` methods are available.
 * The former will insert all entries into this singleton link map, internally
 * calling the latter for each.
 *
 * @typeParam K - Target constructor type.
 * @typeParam V - Linked instance type.
 *
 * @example Preemptively link an instance.
 * ```ts
 * import { Linker } from '@sgrud/utils';
 * import { Service } from './service';
 *
 * new Linker([
 *   [Service, new Service('linked')]
 * ]);
 * ```
 *
 * @see {@link Target}
 * @see {@link Uplink}
 */
@Singleton<typeof Linker>((self, [tuples]) => {
  if (tuples) {
    for (const [key, value] of tuples) {
      self.set(key, value);
    }
  }

  return self;
})
export class Linker<K extends new () => V, V> extends Map<K, V> {

  /**
   * Overridden `Map.prototype.get` method. Looks up the linked instance based
   * on the target constructor. If no linked instance is found, one is created
   * by calling the `new` operaor on the target constructor. Therefor the target
   * constructors must not require parameters (i.e. all parameters have to be
   * optional).
   *
   * @param target - Target constructor.
   * @returns Linked instance.
   *
   * @example Retreive a linked instance.
   * ```ts
   * import { Linker } from '@sgrud/utils';
   * import { Service } from './service';
   *
   * new Linker().get(Service);
   * ```
   */
  public override get(target: K): V {
    let instance = super.get(target);

    if (!instance) {
      instance = new target();
      this.set(target, instance);
    }

    return instance;
  }

  /**
   * Returns all linked instances, which satisfy `instanceof target`. Use this
   * method when multiple linked constructors extend the same base class and are
   * to be retreived.
   *
   * @param target - Target constructor.
   * @returns Linked instances.
   *
   * @example Retreive all linked instances.
   * ```ts
   * import { Linker } from '@sgrud/utils';
   * import { Service } from './service';
   *
   * new Linker().getAll(Service);
   * ```
   */
  public getAll(target: K): V[] {
    const instances = [];

    for (const instance of this.values()) {
      if (instance instanceof target) {
        instances.push(instance);
      }
    }

    return instances;
  }

}
