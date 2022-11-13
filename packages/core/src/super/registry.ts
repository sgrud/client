import { Singleton } from '../utility/singleton';

/**
 * String literal helper type. Enforces any assigned string to contain at least
 * three dots. **Registration**s are used by the [Registry][] to alias classes
 * extending the base [Provider][] as magic strings and should represent sane
 * module paths in dot-notation.
 *
 * [Provider]: https://sgrud.github.io/client/functions/core.Provider
 * [Registry]: https://sgrud.github.io/client/classes/core.Registry
 *
 * @example
 * Library-wide **Registration** pattern:
 * ```ts
 * import type { Registration } from '@sgrud/core';
 *
 * const registration: Registration = 'sgrud.module.path.ClassName';
 * ```
 *
 * @see [Registry][]
 */
export type Registration = `${string}.${string}.${string}`;

/**
 * The [Singleton][] **Registry** is a mapping used by the [Provider][] to
 * lookup [Provide][]d constructors by [Registration][]s upon class extension.
 * Magic strings should represent sane module paths in dot-notation. To
 * programmatically provide constructors by [Registration][]s to extending
 * classes, the inherited *constructor* or *set* methods are available. The
 * former will insert all entries into this [Singleton][] **Registry** map,
 * internally calling the latter for each. Whenever a currently not registered
 * constructor is requested, an intermediary class is created, *cached*
 * internally and returned. When the actual constructor is registered later, the
 * previously created intermediary class is removed from the internal caching
 * and further steps are taken to guarantee the transparent addressing of the
 * actual constructor through the dropped intermediary class.
 *
 * [Provide]: https://sgrud.github.io/client/functions/core.Provide-1
 * [Provider]: https://sgrud.github.io/client/functions/core.Provider
 * [Registration]: https://sgrud.github.io/client/types/core.Registration
 * [Singleton]: https://sgrud.github.io/client/functions/core.Singleton
 *
 * @decorator [Singleton][]
 * @typeParam K - Magic string type.
 * @typeParam V - Constructor type.
 *
 * @see [Provide][]
 * @see [Provider][]
 */
@Singleton<typeof Registry>((self, [tuples]) => {
  if (tuples) {
    for (const [key, value] of tuples) {
      self.set(key, value);
    }
  }

  return self;
})
export class Registry<
  K extends Registration,
  V extends abstract new (...args: any[]) => InstanceType<V>
> extends Map<K, V> {

  /**
   * Internally used mapping of all **cached**, i.e., forward-referenced,
   * constructors. Whenever a constructor, which is not currently registered, is
   * requested as a [Provider][], an intermediary class is created and stored
   * within this map until the actual constructor is registered. As soon as this
   * happens, the intermediary class is removed from this map and further steps
   * are taken to guarantee the transparent addressing of the actual constructor
   * through the dropped intermediary class.
   *
   * [Provider]: https://sgrud.github.io/client/functions/core.Provider
   */
  private readonly cached: Map<K, V>;

  /**
   * Internally used (weak) set containing all intermediary classes created upon
   * requesting a currently not registered constructor as provider. This (weak)
   * set is used internally to check, if a intermediary class has already been
   * replaced by the actual constructor.
   */
  private readonly caches: WeakSet<V>;

  /**
   * Public **constructor**. The constructor of this class accepts the same
   * parameters as its overridden `super` **constructor** and acts the same.
   * I.e., through instantiating this [Singleton][] class and passing a list of
   * tuples of [Registration][]s and their corresponding constructors, these
   * tuples will be stored.
   *
   * [Registration]: https://sgrud.github.io/client/types/core.Registration
   * [Singleton]: https://sgrud.github.io/client/functions/core.Singleton
   *
   * @param tuples - List of constructors to provide.
   *
   * @example
   * Preemptively provide a constructor by magic string:
   * ```ts
   * import type { Registration } from '@sgrud/core';
   * import { Registry } from '@sgrud/core';
   * import { Service } from './service';
   *
   * new Registry<Registration, typeof Service>([
   *   ['sgrud.example.Service', Service]
   * ]);
   * ```
   */
  public constructor(tuples?: [K, V][]) {
    super();

    this.cached = new Map<K, V>();
    this.caches = new WeakSet<V>();

    if (tuples) {
      for (const [key, value] of tuples) {
        this.set(key, value);
      }
    }
  }

  /**
   * Overridden **get** method. Looks up the [Provide][]d constructor by magic
   * string. If no provided constructor is found, an intermediary class is
   * created, *cached* internally and returned. While this intermediary class
   * and the functionality supporting it takes care of inheritance, i.e., allows
   * to forward-reference base classes to be extended, it cannot substitute for
   * the actual extended constructor. Therefore, static extension of
   * forward-referenced classes may be used, but as long as the actual extended
   * constructor is not registered (and therefore the intermediary class is
   * still acting as inheritance cache), the extending class cannot be
   * instantiated, called etc. Doing so will result in a ReferenceError being
   * thrown.
   *
   * [Provide]: https://sgrud.github.io/client/functions/core.Provide-1
   *
   * @param registration - Magic string.
   * @returns [Provide][]d constructor.
   * @throws ReferenceError.
   *
   * @example
   * Retrieve a provided constructor by magic string:
   * ```ts
   * import type { Registration } from '@sgrud/core';
   * import type { Service } from 'example-module';
   * import { Registry } from '@sgrud/core';
   *
   * new Registry<Registration, typeof Service>().get('org.example.Service');
   * ```
   */
  public override get(registration: K): V {
    let constructor = super.get(registration);

    if (!constructor) {
      let cache = class { } as unknown as V;
      this.cached.set(registration, cache);
      this.caches.add(cache);

      constructor = new Proxy(cache, new Proxy({ }, {
        // eslint-disable-next-line @typescript-eslint/no-shadow
        get: (_: any, propertyKey: PropertyKey) => (_: any, ...args: any[]) => {
          if (this.caches.has(cache)) {
            if (!this.cached.has(registration)) {
              cache = super.get(registration)!;
            } else if (args[0] !== 'prototype') {
              throw new ReferenceError(registration);
            }
          }

          const reflection = Reflect[propertyKey as keyof typeof Reflect];
          return (reflection as Function).call(Reflect, cache, ...args);
        }
      }));

      super.set(registration, constructor);
    }

    return constructor;
  }

  /**
   * Overridden **set** method. Whenever a constructor is provided by magic
   * string through calling this method, a check is run, wether this constructor
   * was previously requested and therefore was *cached* as intermediary class.
   * If so, the intermediary class is removed from this internal mapping and
   * further steps are taken to guarantee the transparent addressing of the
   * newly provided constructor through the previously *cached* and now dropped
   * intermediary class.
   *
   * @param registration - Magic string.
   * @param constructor - Providing constructor.
   * @returns This instance.
   *
   * @example
   * Preemptively provide a constructor by magic string:
   * ```ts
   * import type { Registration } from '@sgrud/core';
   * import { Registry } from '@sgrud/core';
   * import { Service } from './service';
   *
   * new Registry<Registration, typeof Service>().set(
   *   'org.example.Service',
   *   Service
   * );
   * ```
   */
  public override set(registration: K, constructor: V): this {
    const cache = this.cached.get(registration);

    if (cache) {
      this.cached.delete(registration);

      Object.defineProperty(constructor, Symbol.hasInstance, {
        value: (instance: unknown) => instance instanceof cache
      });
    }

    return super.set(registration, constructor);
  }

}
