import { Merge } from '../typing/merge';
import { TypeOf } from './type-of';

/**
 * **assign**s (deep copies) the values of all of the enumerable own properties
 * from one or more `sources` to a `target`. The last value within the last
 * `sources` object takes precedence over any previously encountered values.
 *
 * @param target - The `target` object to **assign** properties to.
 * @param sources - An array of `sources` from which to deep copy properties.
 * @typeParam T - The type of the `target` object.
 * @typeParam S - The types of the `sources` objects.
 * @returns The **assign**ed-to `target` object.
 *
 * @example
 * **assign** nested properties:
 * ```ts
 * import { assign } from '@sgrud/core';
 *
 * assign(
 *   { one: { one: true }, two: false },
 *   { one: { key: null } },
 *   { two: true }
 * );
 *
 * // { one: { one: true, key: null }, two: true }
 * ```
 */
export function assign<
  T extends Record<PropertyKey, any>,
  S extends Record<PropertyKey, any>[]
>(target: T, ...sources: [...S]): T & Merge<S[number]> {
  for (const source of sources) {
    for (const key in source) {
      if (TypeOf.object(target[key]) && TypeOf.object(source[key])) {
        target[key] = assign({} as any, target[key], source[key]);
      } else {
        target[key] = source[key];
      }
    }
  }

  return target as T & Merge<S[number]>;
}
