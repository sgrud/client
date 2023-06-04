import { Alias } from '../typing/alias';
import { Singleton } from '../utility/singleton';

/**
 * String literal helper type. Enforces any assigned string to contain at least
 * three dots. **Registration**s are used by the {@link Registry} to alias
 * classes extending the base {@link Provider} as magic strings and should
 * represent sane module paths in dot-notation.
 *
 * @example
 * Library-wide **Registration** pattern:
 * ```ts
 * import { type Registration } from '@sgrud/core';
 *
 * const registration: Registration = 'sgrud.module.ClassName';
 * ```
 *
 * @see {@link Registry}
 */
export type Registration = Alias<`${string}.${string}.${string}`>;

/**
 * The {@link Singleton} **Registry** is a mapping used by the {@link Provider}
 * to lookup {@link Provide}d constructors by {@link Registration}s upon class
 * extension. Magic strings should represent sane module paths in dot-notation.
 * Whenever a currently not registered constructor is requested, an intermediary
 * class is created, {@link cached} internally and returned. When the actual
 * constructor is registered later, the previously created intermediary class is
 * removed from the internal caching and further steps are taken to guarantee
 * the transparent addressing of the actual constructor through the dropped
 * intermediary class.
 *
 * @decorator {@link Singleton}
 * @typeParam K - The magic string {@link Registration} type.
 * @typeParam V - The registered class constructor type.
 *
 * @see {@link Provide}
 * @see {@link Provider}
 */
@Singleton((registry, [tuples]) => {
  if (tuples) {
    for (const [key, value] of tuples) {
      registry.set(key, value);
    }
  }

  return registry;
})
export class Registry<
  K extends Registration,
  V extends abstract new (...args: any[]) => InstanceType<V>
> extends Map<K, V> {

  /**
   * Internal {@link Map}ping of all **cached**, i.e., forward-referenced, class
   * constructors. Whenever a constructor, which is not currently registered, is
   * requested as a {@link Provider}, an intermediary class is created and
   * stored within this map until the actual constructor is registered. As soon
   * as this happens, the intermediary class is removed from this map and
   * further steps are taken to guarantee the transparent addressing of the
   * actual constructor through the dropped intermediary class.
   */
  private readonly cached: Map<K, V>;

  /**
   * Internally used {@link WeakSet} containing all intermediary classes created
   * upon requesting a currently not registered constructor as provider. This
   * set is used internally to check if a intermediary class has already been
   * replaced by the actual constructor.
   */
  private readonly caches: WeakSet<V>;

  /**
   * Public **constructor**. The constructor of this class accepts the same
   * parameters as its overridden `super` {@link Map} **constructor** and acts
   * the same. I.e., through instantiating this {@link Singleton} class and
   * passing a list of `tuples` of {@link Registration}s and their corresponding
   * class constructors, these tuples may be preemptively registered.
   *
   * @param tuples - An {@link Iterable} of `tuples` provide.
   *
   * @example
   * Preemptively provide a class constructor by magic string:
   * ```ts
   * import { type Registration, Registry } from '@sgrud/core';
   * import { Service } from './service';
   *
   * const registration = 'sgrud.example.Service';
   * new Registry<Registration, typeof Service>([
   *   [registration, Service]
   * ]);
   * ```
   */
  public constructor(tuples?: Iterable<[K, V]>) {
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
   * Overridden **get** method. Looks up the {@link Provide}d constructor by
   * magic string. If no provided constructor is found, an intermediary class is
   * created, {@link cached} internally and returned. While this intermediary
   * class and the functionality supporting it take care of inheritance, i.e.,
   * allow forward-referenced base classes to be extended, it cannot substitute
   * for the actual extended constructor. Therefore, the static extension of
   * forward-referenced classes is possible, but as long as the actual extended
   * constructor is not registered (and therefore the intermediary class still
   * {@link caches} the inheritance chain), the extending classes cannot be
   * instantiated, called etc. Doing so will result in a {@link ReferenceError}
   * being thrown.
   *
   * @param registration - The magic string to **get** the class constructor by.
   * @returns The {@link Provide}d constructor or a {@link cached} intermediary.
   * @throws A {@link ReferenceError} when a {@link cached} class is invoked.
   *
   * @example
   * Retrieve a provided constructor by magic string:
   * ```ts
   * import { type Registration, Registry } from '@sgrud/core';
   * import { type Service } from 'example-module';
   *
   * const registration = 'sgrud.example.Service';
   * new Registry<Registration, typeof Service>().get(registration);
   * ```
   */
  public override get(registration: K): V {
    let constructor = super.get(registration);

    if (!constructor) {
      /* c8 ignore next */
      let cache = class {} as unknown as V;
      this.cached.set(registration, cache);
      this.caches.add(cache);

      super.set(registration, constructor = new Proxy(cache, new Proxy({}, {
        // eslint-disable-next-line @typescript-eslint/no-shadow
        get: (_, propertyKey) => (_: unknown, ...args: any[]) => {
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
      })));
    }

    return constructor;
  }

  /**
   * Overridden **set** method. Whenever a class constructor is provided by
   * magic string through calling this method, a test is run, wether this
   * constructor was previously requested and therefore {@link cached} as
   * intermediary class. If so, the intermediary class is removed from the
   * internal mapping and further steps are taken to guarantee the transparent
   * addressing of the newly provided constructor through the previously
   * {@link cached} and now dropped intermediary class.
   *
   * @param registration - The magic string to **set** the class constructor by.
   * @param constructor - The `constructor` to register for the `registration`.
   * @returns This {@link Registry} instance.
   *
   * @example
   * Preemptively provide a constructor by magic string:
   * ```ts
   * import { type Registration, Registry } from '@sgrud/core';
   * import { Service } from './service';
   *
   * const registration = 'sgrud.example.Service';
   * new Registry<Registration, typeof Service>().set(registration, Service);
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
