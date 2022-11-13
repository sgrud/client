import { Merge } from '../typing/merge';
import { TypeOf } from './type-of';

/**
 * **Assign**s (deep copies) the values of all of the enumerable own properties
 * from one or more `source` objects to a `target` object. The last value within
 * the last `source` object takes precedence over any previously encountered
 * values. Returns the `target` object.
 *
 * @param target - Object to **assign** properties to.
 * @param sources - Objects from which to deep copy properties.
 * @typeParam T - Target type.
 * @typeParam S - Source types.
 * @returns **Assign**ed object.
 *
 * @example
 * **Assign** nested properties:
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
        target[key] = assign({ ...target[key] }, source[key]);
      } else {
        target[key] = source[key] as T[S[number][PropertyKey]];
      }
    }
  }

  return target as T & Merge<S[number]>;
}
