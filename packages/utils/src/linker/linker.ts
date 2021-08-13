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
 * @example Retreive a linked instance.
 * ```ts
 * import { Linker } from '@sgrud/utils';
 * import { Service } from './service';
 *
 * new Linker().get(Service);
 * ```
 *
 * @example Preemptively link an instance.
 * ```ts
 * import { Linker } from '@sgrud/utils';
 * import { Service } from './service';
 *
 * new Linker([
 *   Service, new Service('linked')
 * ]);
 * ```
 *
 * @see {@link Target}
 * @see {@link Uplink}
 */
@Singleton<typeof Linker>((self, [entries]) => {
  if (entries) {
    for (const [key, value] of entries) {
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
   */
  public override get(target: K): V {
    let instance = super.get(target);

    if (!instance) {
      instance = new target();
      this.set(target, instance);
    }

    return instance;
  }

}
