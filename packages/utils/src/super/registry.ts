import { Singleton } from '../singleton';

/**
 * String literal helper type. Enforces any assigned string to contain at least
 * three dots. Registrations are used to lookup constructors by magic strings
 * through classes extending the base {@link Provider} and should represent sane
 * package paths in dot-notation.
 *
 * @example Library-wide Provider pattern.
 * ```ts
 * import { Provider } from '@sgrud/utils';
 *
 * const sgrudProvider: Provider = 'sgrud.module.path.ClassName';
 * ```
 *
 * @see {@link Provide}
 * @see {@link Provider}
 * @see {@link Registry}
 */
export type Registration = `${string}.${string}.${string}`;

/**
 * The Registry is a {@link Singleton} map used by the {@link Provider} to
 * lookup {@link Provide}d constructors by magic strings upon class extension.
 * Magic strings should represent sane package paths in dot-notation. To
 * programmatically provide constructors by magic strings to extending classes,
 * the inherited `MapConstructor` or `Map.prototype.set` methods are available.
 * The former will insert all entries into this singleton Registry map,
 * internally calling the latter for each.
 *
 * @decorator {@link Singleton}
 * @typeParam K - Magic string type.
 * @typeParam V - Providing constructor type.
 *
 * @example Preemptively provide a constructor by magic string.
 * ```ts
 * import { Registry } from '@sgrud/utils';
 * import { Service } from './service';
 *
 * new Registry([
 *   ['sgrud.example.Service', Service]
 * ]);
 * ```
 *
 * @see {@link Provide}
 * @see {@link Provider}
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
  V extends abstract new (...args: any[]) => any
> extends Map<K, V> {

  /**
   * Overridden `Map.prototype.get` method. Looks up the {@link Provide}d
   * constructor by magic string. If no provided constructor is found, a
   * `TypeError` is thrown.
   *
   * @param provider - Magic string.
   * @returns Providing constructor.
   * @throws TypeError.
   *
   * @example Retrieve a provided constructor by magic string.
   * ```ts
   * import { Registry } from '@sgrud/utils';
   * import type { Service } from 'example-module';
   *
   * new Registry<any, typeof Service>().get('org.example.Service');
   * ```
   */
  public override get(provider: K): V {
    const constructor = super.get(provider);

    if (!constructor) {
      throw new TypeError(provider);
    }

    return constructor;
  }

}
